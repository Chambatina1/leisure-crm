import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { isAdminRequest } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { enviarCorreo } from '@/lib/mailer';
import { ahoraEnCuba, HORA_CIERRE, reservasDelLote, informeHtml, fechaLarga, puntoDe } from '@/lib/cilindros';

// ═══════════════════════════════════════════════════════════════
// POST /api/cilindros/cierre — cierre diario de ventas de cilindros
//  - Lo llama la tarea programada de Render (cabecera x-cron-secret)
//    a las 00:00 y 01:00 UTC; solo actúa si en Cuba son las 8 PM,
//    así funciona con y sin horario de verano. Un envío por día.
//  - Un admin puede lanzarlo a mano: { lote?: 'YYYY-MM-DD', reenviar?: true }
// ═══════════════════════════════════════════════════════════════

function esCron(request: NextRequest): boolean {
  const esperado = process.env.CRON_SECRET;
  const recibido = request.headers.get('x-cron-secret') || '';
  if (!esperado || esperado.length < 16 || !recibido) return false;
  const a = Buffer.from(esperado);
  const b = Buffer.from(recibido);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function destinatarios(): Promise<string[]> {
  const desdeEnv = process.env.REPORTE_CILINDROS_EMAIL || '';
  let lista = desdeEnv;
  if (!lista) {
    const cfg = await db.config.findMany({ where: { clave: { in: ['email_reportes', 'email'] } } });
    lista =
      cfg.find((c) => c.clave === 'email_reportes')?.valor ||
      cfg.find((c) => c.clave === 'email')?.valor ||
      '';
  }
  return lista
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

export async function POST(request: NextRequest) {
  const cron = esCron(request);
  const admin = !cron && isAdminRequest(request);
  if (!cron && !admin) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  try {
    const body = admin ? await request.json().catch(() => ({})) : {};
    const { dia, hora } = ahoraEnCuba();

    if (cron && hora !== HORA_CIERRE) {
      return NextResponse.json({ ok: true, omitido: `En Cuba son las ${hora}:00; el cierre es a las ${HORA_CIERRE}:00` });
    }

    const lote: string =
      admin && typeof body.lote === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.lote) ? body.lote : dia;
    const marca = `cierre_cilindros_${lote}`;
    const yaEnviado = await db.config.findUnique({ where: { clave: marca } });
    if (yaEnviado && !(admin && body.reenviar)) {
      return NextResponse.json({ ok: true, omitido: `El informe del ${lote} ya se envió (${yaEnviado.valor})` });
    }

    const reservas = await reservasDelLote(lote, true);
    const html = informeHtml(lote, reservas);
    const para = await destinatarios();
    if (para.length === 0) {
      console.error('[cierre cilindros] No hay correo de destino (REPORTE_CILINDROS_EMAIL)');
      return NextResponse.json({ ok: false, error: 'Falta el correo de destino del informe' }, { status: 503 });
    }

    const totalCil = reservas.reduce((s, r) => s + r.cantidad, 0);
    try {
      await enviarCorreo({
        to: para.join(', '),
        subject: `Cierre 8 PM · ${reservas.length} reservas · ${totalCil} cilindros — ${fechaLarga(lote)}`,
        html,
        text: [
          `Listado de recogida de cilindros — ${lote}`,
          ...reservas.map(
            (r, i) => `${i + 1}. [${puntoDe(r.punto).nombre}] Recoge: ${r.nombreRecoge} · Carnet ${r.carnetRecoge} · ${r.cantidad} cil. · ${r.numero} · Comprador: ${r.nombreComprador} (${r.telefonoComprador}) · $${r.montoUsd.toFixed(2)}`
          ),
        ].join('\n'),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[cierre cilindros] Error enviando el informe:', msg);
      return NextResponse.json(
        { ok: false, error: msg === 'SMTP_NO_CONFIGURADO' ? 'El correo de la web (SMTP) no está configurado' : 'No se pudo enviar el correo' },
        { status: 503 }
      );
    }

    const valor = new Date().toISOString();
    if (yaEnviado) await db.config.update({ where: { clave: marca }, data: { valor } });
    else await db.config.create({ data: { clave: marca, valor } });

    console.log(`[cierre cilindros] Informe ${lote} enviado a ${para.length} destinatario(s): ${reservas.length} reservas`);
    return NextResponse.json({ ok: true, lote, reservas: reservas.length, cilindros: totalCil, enviadoA: para });
  } catch (e) {
    console.error('[cierre cilindros] Error:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
