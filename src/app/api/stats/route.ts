import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/stats - Dashboard statistics
export async function GET() {
  try {
    const [
      total,
      pendientes,
      enProceso,
      enTransito,
      enAduana,
      entregados,
      cancelados,
      recentOrders,
    ] = await Promise.all([
      db.pedido.count(),
      db.pedido.count({ where: { estado: 'pendiente' } }),
      db.pedido.count({ where: { estado: 'en_proceso' } }),
      db.pedido.count({ where: { estado: 'en_transito' } }),
      db.pedido.count({ where: { estado: 'en_aduana' } }),
      db.pedido.count({ where: { estado: 'entregado' } }),
      db.pedido.count({ where: { estado: 'cancelado' } }),
      db.pedido.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const trackingCount = await db.trackingEntry.count();

    return NextResponse.json({
      ok: true,
      data: {
        pedidos: {
          total,
          pendientes,
          enProceso,
          enTransito,
          enAduana,
          entregados,
          cancelados,
        },
        tracking: {
          total: trackingCount,
        },
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
