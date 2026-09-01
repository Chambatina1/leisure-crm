import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/tienda - Returns active products grouped by category from the database
export async function GET() {
  try {
    // Fetch all active products from the database, ordered by category then sort order
    const products = await db.tiendaProduct.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { createdAt: 'desc' }],
    });

    // Group products by category
    const grouped: Record<string, typeof products> = {};
    for (const product of products) {
      const cat = product.categoria || 'general';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(product);
    }

    // Return all products and the grouped version for convenience
    return NextResponse.json({
      ok: true,
      data: {
        products,
        grouped,
      },
    });
  } catch (error) {
    console.error('Error fetching tienda:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener productos' }, { status: 500 });
  }
}
