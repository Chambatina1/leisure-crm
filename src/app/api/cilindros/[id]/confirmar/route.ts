import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { confirmarReserva } from '@/lib/pagos-qbo';

// POST /api/cilindros/[id]/confirmar (admin) — pago recibido → genera PIN.
// Con QuickBooks conectado, solo confirma si QuickBooks ya cobró la factura.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const id = parseInt((await params).id, 10);
    const body = await request.json().catch(() => ({}));
    const referencia = String(body.referenciaZelle || '').trim().slice(0, 100);
    const r = await confirmarReserva(id, referencia);
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: r.status });
    const { reserva, correo, movidaAlLote, yaConfirmada } = r.data;
    return NextResponse.json({ ok: true, data: reserva, correo, movidaAlLote, ...(yaConfirmada ? { yaConfirmada } : {}) });
  } catch (e) {
    console.error('[cilindros] Error al confirmar:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
