import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { confirmarSolicitud } from '@/lib/pagos-qbo';

// ═══════════════════════════════════════════════════════════════
// POST /api/cupet/solicitud/[id]/confirmar  (admin)
// Pago confirmado → se registra la orden en CUPET → PIN generado.
// Con QuickBooks conectado, solo si QuickBooks ya cobró la factura.
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }
    const { id } = await params;
    const r = await confirmarSolicitud(parseInt(id, 10));
    if (!r.ok) {
      const { status, ...resto } = r;
      return NextResponse.json(resto, { status });
    }
    return NextResponse.json(r);
  } catch (e) {
    console.error('[cupet] Error:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
