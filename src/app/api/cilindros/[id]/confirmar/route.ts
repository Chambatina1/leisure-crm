import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { confirmarReservaCilindro } from '@/lib/confirmar-reserva';

// POST /api/cilindros/[id]/confirmar (admin) — pago recibido → genera PIN
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const id = parseInt((await params).id, 10);
    const body = await request.json().catch(() => ({}));
    const referencia = String(body.referenciaZelle || '').trim().slice(0, 100);
    const r = await confirmarReservaCilindro(id, referencia);
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: r.status });
    return NextResponse.json(r);
  } catch (e) {
    console.error('[cilindros] Error al confirmar:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
