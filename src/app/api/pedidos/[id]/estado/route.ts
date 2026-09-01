import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ESTADOS_VALIDOS = ['pendiente', 'en_proceso', 'en_transito', 'en_aduana', 'entregado', 'cancelado'];

// PATCH /api/pedidos/[id]/estado - Update pedido status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { estado } = body;

    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json(
        { ok: false, error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}` },
        { status: 400 }
      );
    }

    const pedido = await db.pedido.update({
      where: { id: parseInt(id, 10) },
      data: { estado },
    });

    return NextResponse.json({ ok: true, data: pedido });
  } catch (error) {
    console.error('Error updating estado:', error);
    return NextResponse.json({ ok: false, error: 'Error al actualizar estado' }, { status: 500 });
  }
}
