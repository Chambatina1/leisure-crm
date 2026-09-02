import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureCatalogo } from '@/lib/catalogo-seed';

// Convierte la imagen guardada (base64 en BD) en una URL ligera por producto.
// La versión (?v=) cambia cuando el producto se actualiza: si el dueño cambia
// la foto, la URL cambia y el navegador descarga la nueva (caché immutable ok).
function toImageUrl(id: number, imagenUrl: string | null, updatedAt: Date): string | null {
  if (!imagenUrl) return null;
  if (imagenUrl.startsWith('data:')) return `/api/tienda/imagen/${id}?v=${new Date(updatedAt).getTime()}`;
  return imagenUrl;
}

// GET /api/tienda - Productos activos agrupados por categoría
export async function GET() {
  try {
    // Si el catálogo quedó vacío (p. ej. BD reiniciada), auto-restaurar desde la semilla
    await ensureCatalogo();

    const products = await db.tiendaProduct.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { createdAt: 'desc' }],
    });

    // Servir imágenes por URL (no incrustar base64 de megas en el JSON)
    const light = products.map((p) => ({
      ...p,
      imagenUrl: toImageUrl(p.id, p.imagenUrl, p.updatedAt),
    }));

    // Agrupar por categoría
    const grouped: Record<string, typeof light> = {};
    for (const product of light) {
      const cat = product.categoria || 'general';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(product);
    }

    return NextResponse.json({
      ok: true,
      data: { products: light, grouped },
    });
  } catch (error) {
    console.error('Error fetching tienda:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener productos' }, { status: 500 });
  }
}
