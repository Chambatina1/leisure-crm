import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { enviarCorreoBienvenida } from '@/lib/welcome-email';
import { clientIp } from '@/lib/admin-auth';
import { verificarCodigo, limiteIp } from '@/lib/verificacion-email';
import { setClienteCookie } from '@/lib/cliente-auth';

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
  codigo: z.string().trim().regex(/^\d{6}$/, 'Código de 6 dígitos requerido'),
  website: z.string().optional(), // trampa anti-bots
});

// ─── POST /api/users/register ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          ok: false,
          error:
            Object.values(validated.error.flatten().fieldErrors).flat()[0] || 'Datos inválidos',
        },
        { status: 400 }
      );
    }

    const ip = clientIp(request);
    if (!limiteIp(`registro:${ip}`, 15, 15 * 60 * 1000)) {
      return NextResponse.json(
        { ok: false, error: 'Demasiados intentos. Espera unos minutos.' },
        { status: 429 }
      );
    }

    const { nombre, email, telefono, direccion, ciudad, codigo, website } = validated.data;
    if (website) {
      return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });
    }

    // ── Verificar el código enviado al correo ────────────────────────
    const verif = await verificarCodigo(email, codigo);
    if (!verif.ok) {
      return NextResponse.json({ ok: false, error: verif.error }, { status: 400 });
    }

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
    enviarCorreoBienvenida(user.nombre, user.email).catch((err) =>
      console.error('[Registro] Error enviando correo de bienvenida:', err)
    );

    // ── Respuesta sin password ───────────────────────────────────────
    const { password: _pw, ...userWithoutPassword } = user;

    const res = NextResponse.json(
      { ok: true, data: userWithoutPassword },
      { status: 201 }
    );
    setClienteCookie(res, user.id); // queda con la sesión iniciada
    return res;
  } catch (error) {
    console.error('[Registro] Error al registrar usuario:', error);
    return NextResponse.json(
      { ok: false, error: 'Error interno al registrar usuario' },
      { status: 500 }
    );
  }
}
