import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { asegurarTablaReservas, type Reserva } from '@/lib/cilindros';

// POST /api/cilindros/[id]/anular (admin)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    await asegurarTablaReservas();
    const id = parseInt((await params).id, 10);
    const act = await db.$queryRawUnsafe<Reserva[]>(
      `UPDATE "ReservaCilindro" SET "estado"='anulada' WHERE "id"=$1 AND "estado" <> 'entregada' RETURNING *`,
      id
    );
    if (!act[0]) return NextResponse.json({ ok: false, error: 'No se puede anular (no existe o ya se entregó)' }, { status: 400 });
    return NextResponse.json({ ok: true, data: act[0] });
  } catch (e) {
    console.error('[cilindros] Error al anular:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
