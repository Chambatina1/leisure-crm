import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { asegurarTablaReservas, loteActual, reservasDelLote, ahoraEnCuba, HORA_CIERRE } from '@/lib/cilindros';

// GET /api/cilindros?lote=YYYY-MM-DD (admin) — reservas de un día + resumen
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    await asegurarTablaReservas();
    const pedido = request.nextUrl.searchParams.get('lote');
    const lote = pedido && /^\d{4}-\d{2}-\d{2}$/.test(pedido) ? pedido : loteActual();
    const reservas = await reservasDelLote(lote);
    const lotes = await db.$queryRawUnsafe<{ lote: string; n: number }[]>(
      `SELECT "lote", COUNT(*)::int AS n FROM "ReservaCilindro" GROUP BY "lote" ORDER BY "lote" DESC LIMIT 30`
    );
    const pendientesTodas = await db.$queryRawUnsafe<unknown[]>(
      `SELECT * FROM "ReservaCilindro" WHERE "estado"='pendiente_pago' ORDER BY "id" DESC LIMIT 200`
    );
    const confirmadas = reservas.filter((r) => r.estado === 'pagada' || r.estado === 'entregada');
    const { dia, hora } = ahoraEnCuba();
    return NextResponse.json({
      ok: true,
      data: {
        lote,
        loteAbierto: loteActual(),
        cerradoHoy: hora >= HORA_CIERRE,
        hoyCuba: dia,
        reservas,
        pendientesTodas,
        lotes,
        resumen: {
          total: reservas.length,
          pendientes: reservas.filter((r) => r.estado === 'pendiente_pago').length,
          confirmadas: confirmadas.length,
          entregadas: reservas.filter((r) => r.estado === 'entregada').length,
          cilindros: confirmadas.reduce((s, r) => s + r.cantidad, 0),
          usd: confirmadas.reduce((s, r) => s + r.montoUsd, 0),
        },
      },
    });
  } catch (e) {
    console.error('[cilindros] Error al listar:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
