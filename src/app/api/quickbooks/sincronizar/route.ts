import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { esCron } from '@/lib/cron-auth';
import { sincronizarPagos } from '@/lib/pagos-qbo';

// POST /api/quickbooks/sincronizar (admin o tarea programada) —
// confirma las reservas y solicitudes que QuickBooks ya cobró.
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request) && !esCron(request)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, data: await sincronizarPagos() });
  } catch (e) {
    console.error('[qbo] Error al sincronizar:', e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 });
  }
}
