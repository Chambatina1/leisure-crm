import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Esquemas de validación ─────────────────────────────────────────────
const optionalUrl = z.string().optional().or(z.literal(''));
const createSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional().or(z.literal('')),
  precio: z.coerce.number().positive('El precio debe ser mayor a 0'),
  categoria: z.string().min(1, 'La categoría es requerida'),
  tiktokUrl: optionalUrl,
  imagenUrl: optionalUrl,
  activo: z.boolean().optional().default(true),
  orden: z.number().int().optional().default(0),
});

const updateSchema = z.object({
  id: z.number().int().positive('ID inválido'),
  nombre: z.string().min(2).optional(),
  descripcion: z.string().optional().or(z.literal('')),
  precio: z.coerce.number().positive().optional(),
  categoria: z.string().min(1).optional(),
  tiktokUrl: optionalUrl,
  imagenUrl: optionalUrl,
  activo: z.boolean().optional(),
  orden: z.number().int().optional(),
});

// ─── GET /api/tienda/admin ─────────────────────────────────────────────
// Obtiene todos los productos. Filtros: ?categoria=X & ?activo=true/false
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const activoParam = searchParams.get('activo');

    const where: Record<string, unknown> = {};

    if (categoria) {
      where.categoria = categoria;
    }

    if (activoParam !== null && activoParam !== '') {
      where.activo = activoParam === 'true';
    }

    const products = await db.tiendaProduct.findMany({
      where,
      orderBy: [{ orden: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ ok: true, data: products });
  } catch (error) {
    console.error('[Tienda Admin] Error al obtener productos:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al obtener productos' },
      { status: 500 }
    );
  }
}

// ─── POST /api/tienda/admin ────────────────────────────────────────────
// Crea un nuevo producto.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { ok: false, error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validated.data;

    const product = await db.tiendaProduct.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        precio: data.precio,
        categoria: data.categoria,
        tiktokUrl: data.tiktokUrl || null,
        imagenUrl: data.imagenUrl || null,
        activo: data.activo,
        orden: data.orden,
      },
    });

    return NextResponse.json({ ok: true, data: product }, { status: 201 });
  } catch (error) {
    console.error('[Tienda Admin] Error al crear producto:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al crear producto' },
      { status: 500 }
    );
  }
}

// ─── PUT /api/tienda/admin ─────────────────────────────────────────────
// Actualiza un producto existente.
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = updateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { ok: false, error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, ...updateData } = validated.data;

    // ── Verificar existencia ─────────────────────────────────────────
    const existing = await db.tiendaProduct.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // ── Construir datos de actualización (solo campos proporcionados) ─
    const data: Record<string, unknown> = {};
    if (updateData.nombre !== undefined) data.nombre = updateData.nombre;
    if (updateData.descripcion !== undefined)
      data.descripcion = updateData.descripcion || null;
    if (updateData.precio !== undefined) data.precio = updateData.precio;
    if (updateData.categoria !== undefined) data.categoria = updateData.categoria;
    if (updateData.tiktokUrl !== undefined)
      data.tiktokUrl = updateData.tiktokUrl || null;
    if (updateData.imagenUrl !== undefined)
      data.imagenUrl = updateData.imagenUrl || null;
    if (updateData.activo !== undefined) data.activo = updateData.activo;
    if (updateData.orden !== undefined) data.orden = updateData.orden;

    const product = await db.tiendaProduct.update({
      where: { id },
      data,
    });

    return NextResponse.json({ ok: true, data: product });
  } catch (error) {
    console.error('[Tienda Admin] Error al actualizar producto:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/tienda/admin?id=X ─────────────────────────────────────
// Elimina un producto por ID.
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      return NextResponse.json(
        { ok: false, error: 'El parámetro "id" es requerido' },
        { status: 400 }
      );
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const existing = await db.tiendaProduct.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    await db.tiendaProduct.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      data: { message: 'Producto eliminado correctamente' },
    });
  } catch (error) {
    console.error('[Tienda Admin] Error al eliminar producto:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al eliminar producto' },
      { status: 500 }
    );
  }
}
