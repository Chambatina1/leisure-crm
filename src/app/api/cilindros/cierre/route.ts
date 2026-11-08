import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { isAdminRequest } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { enviarCorreo } from '@/lib/mailer';
import { leerPuntosDisponibles } from '@/lib/puntos-recogida';
import { existenciasDisponibles } from '@/lib/existencia';
import { esBalitaGas } from '@/lib/puntos-gas';
import { ahoraEnCuba, HORA_CIERRE, reservasDelLote, informeHtml, fechaLarga, pedidosDelDia, ZELLE_DESTINO, diaRecogida, resumenPorPunto } from '@/lib/cilindros';

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
  // El resumen siempre llega también al correo de ventas (el de Zelle)
  return [...new Set(`${lista},${ZELLE_DESTINO}`.toLowerCase()
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))];
}

const HORA_ACTUALIZACION = 9; // 9:00 AM en Cuba

function diaAnterior(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const cron = esCron(request);
  const admin = !cron && isAdminRequest(request);
  if (!cron && !admin) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  try {
    const body = admin ? await request.json().catch(() => ({})) : {};
    const { dia, hora } = ahoraEnCuba();

    // 8 PM: cierre del día. 9 AM: el mismo resumen del cierre de anoche, actualizado
    // (entregas marcadas y lo que queda disponible en cada punto).
    const manana = admin ? body.modo === '9am' : hora === HORA_ACTUALIZACION;
    if (cron && hora !== HORA_CIERRE && hora !== HORA_ACTUALIZACION) {
      return NextResponse.json({ ok: true, omitido: `En Cuba son las ${hora}:00; el resumen sale a las ${HORA_CIERRE}:00 y a las ${HORA_ACTUALIZACION}:00` });
    }

    const lote: string =
      admin && typeof body.lote === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.lote) ? body.lote : manana ? diaAnterior(dia) : dia;
    const marca = manana ? `resumen9am_cilindros_${lote}` : `cierre_cilindros_${lote}`;
    const yaEnviado = await db.config.findUnique({ where: { clave: marca } });
    if (yaEnviado && !(admin && body.reenviar)) {
      return NextResponse.json({ ok: true, omitido: `El informe del ${lote} ya se envió (${yaEnviado.valor})` });
    }

    const reservas = await reservasDelLote(lote, true);
    const pedidos = await pedidosDelDia(lote);
    const puntos = await leerPuntosDisponibles();
    const gas = await db.tiendaProduct.findMany({ where: { activo: true }, select: { id: true, nombre: true }, orderBy: { orden: 'asc' } });
    const cilindros = gas.filter((g) => esBalitaGas(g.nombre));
    const stock = await existenciasDisponibles(cilindros.map((c) => c.id));
    const disponibles = cilindros.map((c) => ({ nombre: c.nombre, quedan: stock.get(c.id) ?? null }));
    const titulo = manana ? `Resumen actualizado 9:00 AM · ${fechaLarga(dia)}` : undefined;
    const para = await destinatarios();
    if (para.length === 0) {
      console.error('[cierre cilindros] No hay correo de destino (REPORTE_CILINDROS_EMAIL)');
      return NextResponse.json({ ok: false, error: 'Falta el correo de destino del informe' }, { status: 503 });
    }

    // Un correo por punto de gas (todos al mismo destinatario), para mandar a cada
    // punto solo sus ventas. Lo que no tenga punto y los pedidos de tienda van aparte.
    const conVentas = new Set(reservas.map((r) => r.puntoId));
    const puntosInforme = puntos.filter((p) => p.activo || conVentas.has(p.id));
    const sinPunto = reservas.filter((r) => !puntosInforme.some((p) => p.id === r.puntoId));
    const grupos: { nombre: string; reservas: typeof reservas; puntos: typeof puntos; pedidos: typeof pedidos; disponibles?: typeof disponibles }[] =
      puntosInforme.map((p) => ({ nombre: p.nombre, reservas: reservas.filter((r) => r.puntoId === p.id), puntos: [p], pedidos: [] as typeof pedidos }));
    if (sinPunto.length || pedidos.length || grupos.length === 0) {
      grupos.push({ nombre: 'Otros (sin punto y pedidos de tienda)', reservas: sinPunto, puntos: [], pedidos, disponibles });
    }

    const tipo = manana ? 'Resumen actualizado 9 AM' : 'Resumen 8 PM';
    const enviados: string[] = [];
    try {
      for (const g of grupos) {
        const cil = g.reservas.reduce((s, r) => s + r.cantidad, 0);
        const tituloGrupo = `${titulo ?? `Cierre 8:00 PM · ${fechaLarga(lote)}`} · ${g.nombre}`;
        await enviarCorreo({
          to: para.join(', '),
          subject: `${tipo} · ${g.nombre} · ${cil} balitas${g.pedidos.length ? ` · ${g.pedidos.length} pedidos de tienda` : ''} — ${fechaLarga(lote)}`,
          html: informeHtml(lote, g.reservas, g.pedidos, g.puntos, { titulo: tituloGrupo, disponibles: g.disponibles }),
          text: [
            `${g.nombre} — listado de recogida de balitas — ${lote} (se entregan a partir del ${diaRecogida(lote)})`,
            ...resumenPorPunto(g.reservas, g.puntos).map((f) => `${f.punto}: vendidas ${f.vendidas} (a repartir) · disponibles ahora ${f.quedan ?? 'sin cantidad asignada'}`),
            ...(g.disponibles ?? []).map((d) => `Disponible en la tienda · ${d.nombre}: ${d.quedan ?? 'sin límite'}`),
            '',
            ...g.reservas.map(
              (r, i) => `${i + 1}. ${r.puntoRecogida || ''} · Recoge: ${r.nombreRecoge} · Carnet ${r.carnetRecoge} · PIN ${r.pin || ''} · ${r.cantidad} cil. · ${r.numero} · Comprador: ${r.nombreComprador} (${r.telefonoComprador}) · $${r.montoUsd.toFixed(2)}`
            ),
          ].join('\n'),
        });
        enviados.push(g.nombre);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[cierre cilindros] Error enviando el informe:', msg, 'enviados:', enviados);
      return NextResponse.json(
        { ok: false, enviados, error: msg === 'SMTP_NO_CONFIGURADO' ? 'El correo de la web (SMTP) no está configurado' : 'No se pudo enviar el correo' },
        { status: 503 }
      );
    }
    const totalCil = reservas.reduce((s, r) => s + r.cantidad, 0);

    const valor = new Date().toISOString();
    if (yaEnviado) await db.config.update({ where: { clave: marca }, data: { valor } });
    else await db.config.create({ data: { clave: marca, valor } });

    console.log(`[cierre cilindros] Informe ${lote} enviado a ${para.length} destinatario(s): ${reservas.length} reservas`);
    return NextResponse.json({ ok: true, lote, reservas: reservas.length, cilindros: totalCil, enviadoA: para, correos: enviados });
  } catch (e) {
    console.error('[cierre cilindros] Error:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
