import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const pedidoSchema = z.object({
  nombreComprador: z.string().min(2, 'El nombre del comprador es requerido'),
  emailComprador: z.string().email('Email inválido').optional().or(z.literal('')),
  telefonoComprador: z.string().min(7, 'El teléfono del comprador es requerido'),
  nombreDestinatario: z.string().min(2, 'El nombre del destinatario es requerido'),
  telefonoDestinatario: z.string().min(7, 'El teléfono del destinatario es requerido'),
  carnetDestinatario: z.string().optional().or(z.literal('')),
  direccionDestinatario: z.string().min(5, 'La dirección es requerida'),
  producto: z.string().min(2, 'El producto es requerido'),
  notas: z.string().optional().or(z.literal('')),
});

// GET /api/pedidos - List pedidos with pagination, filter, search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const where: Record<string, unknown> = {};

    if (estado) {
      where.estado = estado;
    }

    if (search) {
      where.OR = [
        { nombreComprador: { contains: search } },
        { nombreDestinatario: { contains: search } },
        { producto: { contains: search } },
        { emailComprador: { contains: search } },
        { telefonoComprador: { contains: search } },
      ];
    }

    const [pedidos, total] = await Promise.all([
      db.pedido.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.pedido.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: pedidos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching pedidos:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener pedidos' }, { status: 500 });
  }
}

// POST /api/pedidos - Create new pedido
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = pedidoSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { ok: false, error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validated.data;
    const pedido = await db.pedido.create({
      data: {
        nombreComprador: data.nombreComprador,
        emailComprador: data.emailComprador || null,
        telefonoComprador: data.telefonoComprador,
        nombreDestinatario: data.nombreDestinatario,
        telefonoDestinatario: data.telefonoDestinatario,
        carnetDestinatario: data.carnetDestinatario || null,
        direccionDestinatario: data.direccionDestinatario,
        producto: data.producto,
        notas: data.notas || null,
      },
    });

    return NextResponse.json({ ok: true, data: pedido }, { status: 201 });
  } catch (error) {
    console.error('Error creating pedido:', error);
    return NextResponse.json({ ok: false, error: 'Error al crear pedido' }, { status: 500 });
  }
}
