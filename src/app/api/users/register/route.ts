import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Validación con Zod ────────────────────────────────────────────────
const registerSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .trim(),
  email: z.string().email('Email inválido').toLowerCase().trim(),
  telefono: z.string().optional().or(z.literal('')),
  direccion: z.string().optional().or(z.literal('')),
  ciudad: z.string().optional().or(z.literal('')),
});

// ─── Helper: enviar correo de bienvenida ───────────────────────────────
async function sendWelcomeEmail(user: {
  id: number;
  nombre: string;
  email: string;
  telefono?: string | null;
}) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    await fetch(`${baseUrl}/api/email/welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: {
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
        },
      }),
    });
  } catch (err) {
    console.error('[Registro] Error enviando correo de bienvenida:', err);
  }
}

// ─── POST /api/users/register ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { ok: false, error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { nombre, email, telefono, direccion, ciudad } = validated.data;

    // ── Verificar email duplicado ────────────────────────────────────
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: 'Ya existe un usuario registrado con ese email' },
        { status: 409 }
      );
    }

    // ── Crear usuario ────────────────────────────────────────────────
    const user = await db.user.create({
      data: {
        nombre,
        email,
        telefono: telefono || null,
        direccion: direccion || null,
        ciudad: ciudad || null,
      },
    });

    // ── Enviar correo de bienvenida (fire-and-forget) ───────────────
    sendWelcomeEmail(user);

    // ── Respuesta sin password ───────────────────────────────────────
    const { password: _pw, ...userWithoutPassword } = user;

    return NextResponse.json(
      { ok: true, data: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Registro] Error al registrar usuario:', error);
    return NextResponse.json(
      { ok: false, error: 'Error interno al registrar usuario' },
      { status: 500 }
    );
  }
}
