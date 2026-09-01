import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/pedidos/[id] - Get single pedido
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pedido = await db.pedido.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!pedido) {
      return NextResponse.json({ ok: false, error: 'Pedido no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: pedido });
  } catch (error) {
    console.error('Error fetching pedido:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener pedido' }, { status: 500 });
  }
}

// PUT /api/pedidos/[id] - Update pedido
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const pedido = await db.pedido.update({
      where: { id: parseInt(id, 10) },
      data: {
        nombreComprador: body.nombreComprador,
        emailComprador: body.emailComprador || null,
        telefonoComprador: body.telefonoComprador,
        nombreDestinatario: body.nombreDestinatario,
        telefonoDestinatario: body.telefonoDestinatario,
        carnetDestinatario: body.carnetDestinatario || null,
        direccionDestinatario: body.direccionDestinatario,
        producto: body.producto,
        notas: body.notas || null,
      },
    });

    return NextResponse.json({ ok: true, data: pedido });
  } catch (error) {
    console.error('Error updating pedido:', error);
    return NextResponse.json({ ok: false, error: 'Error al actualizar pedido' }, { status: 500 });
  }
}

// DELETE /api/pedidos/[id] - Delete pedido
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.pedido.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ ok: true, message: 'Pedido eliminado' });
  } catch (error) {
    console.error('Error deleting pedido:', error);
    return NextResponse.json({ ok: false, error: 'Error al eliminar pedido' }, { status: 500 });
  }
}
