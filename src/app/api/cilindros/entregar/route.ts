import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { asegurarTablaReservas, type Reserva } from '@/lib/cilindros';

// POST /api/cilindros/entregar (admin) { carnet, pin } — comprueba y marca entregada
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    await asegurarTablaReservas();
    const body = await request.json().catch(() => ({}));
    const carnet = String(body.carnet || '').replace(/\D/g, '');
    const pin = String(body.pin || '').replace(/\D/g, '');
    if (carnet.length !== 11 || pin.length !== 6) {
      return NextResponse.json({ ok: false, error: 'Escribe el carnet (11 dígitos) y el PIN (6 dígitos)' }, { status: 400 });
    }
    const filas = await db.$queryRawUnsafe<Reserva[]>(
      `SELECT * FROM "ReservaCilindro" WHERE "carnetRecoge"=$1 AND "pin"=$2 ORDER BY "id" DESC LIMIT 1`,
      carnet,
      pin
    );
    const r = filas[0];
    if (!r) return NextResponse.json({ ok: false, error: 'PIN o carnet incorrectos. No entregar.' }, { status: 404 });
    if (r.estado === 'entregada') {
      return NextResponse.json(
        { ok: false, error: `Esta reserva ya se entregó${r.entregadaEn ? ' el ' + new Date(r.entregadaEn).toLocaleString('es-ES', { timeZone: 'America/Havana' }) : ''}. No entregar de nuevo.`, data: r },
        { status: 409 }
      );
    }
    if (r.estado !== 'pagada') {
      return NextResponse.json({ ok: false, error: `Reserva ${r.estado.replace('_', ' ')}. No entregar.` }, { status: 409 });
    }
    const act = await db.$queryRawUnsafe<Reserva[]>(
      `UPDATE "ReservaCilindro" SET "estado"='entregada', "entregadaEn"=NOW() WHERE "id"=$1 AND "estado"='pagada' RETURNING *`,
      r.id
    );
    return NextResponse.json({ ok: true, data: act[0] });
  } catch (e) {
    console.error('[cilindros] Error al entregar:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
