import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── GET /api/users ────────────────────────────────────────────────────
// Lista paginada de usuarios con conteo de pedidos.
// Query params: search, page, limit, activo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
    const activoParam = searchParams.get('activo');

    // ── Construir cláusula WHERE ─────────────────────────────────────
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (activoParam !== null && activoParam !== '') {
      where.isActive = activoParam === 'true';
    }

    // ── Obtener usuarios con conteo de pedidos ───────────────────────
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { registeredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          direccion: true,
          ciudad: true,
          isActive: true,
          registeredAt: true,
          updatedAt: true,
        },
      }),
      db.user.count({ where }),
    ]);

    // ── Contar pedidos por email de comprador (relación indirecta) ──
    const pedidoCounts = await db.pedido.groupBy({
      by: ['emailComprador'],
      where: {
        emailComprador: { in: users.map((u) => u.email) },
      },
      _count: { id: true },
    });

    const countMap = new Map<string, number>();
    for (const pc of pedidoCounts) {
      if (pc.emailComprador) {
        countMap.set(pc.emailComprador, pc._count.id);
      }
    }

    const usersWithCount = users.map((u) => ({
      ...u,
      pedidosCount: countMap.get(u.email) || 0,
    }));

    return NextResponse.json({
      ok: true,
      data: usersWithCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Usuarios] Error al obtener usuarios:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/users ───────────────────────────────────────────────────
// Activa / desactiva un usuario.
// Body: { id, isActive }
const toggleSchema = z.object({
  id: z.number().int().positive('ID inválido'),
  isActive: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = toggleSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { ok: false, error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, isActive } = validated.data;

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const updated = await db.user.update({
      where: { id },
      data: { isActive },
    });

    const { password: _pw, ...userWithoutPassword } = updated;

    return NextResponse.json({ ok: true, data: userWithoutPassword });
  } catch (error) {
    console.error('[Usuarios] Error al actualizar estado:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al actualizar estado del usuario' },
      { status: 500 }
    );
  }
}
