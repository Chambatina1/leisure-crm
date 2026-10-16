import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { esCron } from '@/lib/cron-auth';
import { enviarCorreo } from '@/lib/mailer';
import { qboConectado } from '@/lib/quickbooks';
import { sincronizarPagos } from '@/lib/pagos-qbo';
import { destinatariosInforme, informeSemanal } from '@/lib/contabilidad';

// POST /api/contabilidad/informe-semanal — correo de los viernes con la utilidad.
// Lo llama la tarea programada de Render (x-cron-secret) o un admin con { prueba: true }.
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request) && !esCron(request)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  if (!(await qboConectado())) {
    return NextResponse.json({ ok: false, error: 'QuickBooks no está conectado' }, { status: 503 });
  }
  const para = await destinatariosInforme();
  if (!para.length) {
    return NextResponse.json({ ok: false, error: 'No hay correo configurado para el informe' }, { status: 400 });
  }
  try {
    // Antes del informe, confirma los pagos que QuickBooks ya cobró
    await sincronizarPagos().catch((e) => console.error('[qbo] Sincronización previa:', e instanceof Error ? e.message : e));
    const inf = await informeSemanal();
    await enviarCorreo({ to: para.join(', '), subject: inf.asunto, text: inf.texto, html: inf.html });
    return NextResponse.json({
      ok: true,
      data: { enviadoA: para, utilidadSemana: inf.semana.utilidad, utilidadMes: inf.mes.utilidad },
    });
  } catch (e) {
    console.error('[contabilidad] Error en el informe semanal:', e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 });
  }
}
