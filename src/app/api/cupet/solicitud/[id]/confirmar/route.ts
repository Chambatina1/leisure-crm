import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { confirmarSolicitudCombustible } from '@/lib/pin-combustible';

// ═══════════════════════════════════════════════════════════════
// POST /api/cupet/solicitud/[id]/confirmar  (admin)
// El operador confirma el pago por Zelle → se registra la orden en
// CUPET → PIN generado → queda guardado en la solicitud.
// (El aviso automático de Zelle usa la misma función.)
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }
    const { id } = await params;
    const r = await confirmarSolicitudCombustible(parseInt(id, 10));
    if (r.ok) return NextResponse.json({ ok: true, data: r.data, ...(r.yaPagada ? { yaPagada: true } : {}) });
    const { status, ...resto } = r;
    return NextResponse.json(resto, { status });
  } catch (e) {
    console.error('[cupet] Error:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
