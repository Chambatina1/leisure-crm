import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/tienda/imagen/[id] — sirve la foto del producto guardada en la BD.
// Evita enviar megas de base64 dentro del listado de productos: la tienda pide
// cada imagen por URL y el navegador la cachea (immutable).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId) || productId <= 0) {
      return new NextResponse('ID inválido', { status: 400 });
    }

    const product = await db.tiendaProduct.findUnique({
      where: { id: productId },
      select: { imagenUrl: true },
    });

    const imagen = product?.imagenUrl;
    if (!imagen) {
      return new NextResponse('Sin imagen', { status: 404 });
    }

    // URL externa normal → redirigir
    if (!imagen.startsWith('data:')) {
      return NextResponse.redirect(imagen);
    }

    const [meta, b64] = imagen.split(',');
    if (!b64) {
      return new NextResponse('Imagen corrupta', { status: 404 });
    }

    const mime = meta.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
    const bytes = Buffer.from(b64, 'base64');

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(bytes.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[Tienda Imagen] Error:', error);
    return new NextResponse('Error del servidor', { status: 500 });
  }
}
