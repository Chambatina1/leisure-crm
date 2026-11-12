import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { balanceBalitas, guardarCostoBalita } from '@/lib/contabilidad-balitas';

export const dynamic = 'force-dynamic';

// GET /api/cilindros/contabilidad?punto=<id> (admin) — balance de las balitas por punto de venta
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const punto = (request.nextUrl.searchParams.get('punto') || '').trim().slice(0, 60);
    return NextResponse.json({ ok: true, data: await balanceBalitas(punto) });
  } catch (e) {
    console.error('[contabilidad] Error al calcular el balance:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}

// PUT /api/cilindros/contabilidad { costoBalita: number | null } (admin) — costo de compra de una balita
export async function PUT(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => ({}));
    const v = body?.costoBalita;
    if (v !== null && !(typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 10000)) {
      return NextResponse.json({ ok: false, error: 'Costo no válido' }, { status: 400 });
    }
    await guardarCostoBalita(v === null ? null : Math.round(v * 100) / 100);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[contabilidad] Error al guardar el costo:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
