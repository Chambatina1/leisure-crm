import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { z } from 'zod';
import { enviarCorreoBienvenida } from '@/lib/welcome-email';

// ─── Validación ────────────────────────────────────────────────────────
const welcomeSchema = z.object({
  user: z.object({
    nombre: z.string().min(2),
    email: z.string().email(),
    telefono: z.string().optional().or(z.literal('')),
  }),
});


// ─── POST /api/email/welcome (solo admin: reenviar bienvenida) ─────────
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const validated = welcomeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { ok: false, error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { nombre, email } = validated.data.user;
    const r = await enviarCorreoBienvenida(nombre, email);

    return NextResponse.json({
      ok: r.estado === 'enviado',
      data: { estado: r.estado, tipo: 'bienvenida', to: email, messageId: r.messageId },
      ...(r.warning ? { warning: r.warning } : {}),
      ...(r.error ? { error: r.error } : {}),
    });
  } catch (error) {
    console.error('[Welcome] Error al enviar correo de bienvenida:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al enviar correo de bienvenida' },
      { status: 500 }
    );
  }
}
