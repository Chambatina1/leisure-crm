import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { clientIp } from '@/lib/admin-auth';
import { verificarCodigo, limiteIp } from '@/lib/verificacion-email';
import { setClienteCookie } from '@/lib/cliente-auth';

// POST /api/users/login { email, codigo } — inicia sesión de cliente
const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(150),
  codigo: z.string().trim().regex(/^\d{6}$/),
});

export async function POST(request: NextRequest) {
  try {
    if (!limiteIp(`login-v:${clientIp(request)}`, 20, 15 * 60 * 1000)) {
      return NextResponse.json({ ok: false, error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 });
    }
    const p = schema.safeParse(await request.json());
    if (!p.success) return NextResponse.json({ ok: false, error: 'Escribe el código de 6 dígitos' }, { status: 400 });
    const { email, codigo } = p.data;
    const v = await verificarCodigo(email, codigo);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
    const u = await db.user.findUnique({
      where: { email },
      select: { id: true, nombre: true, email: true, telefono: true, direccion: true, isActive: true },
    });
    if (!u || !u.isActive) return NextResponse.json({ ok: false, error: 'Cuenta no disponible' }, { status: 403 });
    const { isActive: _a, ...data } = u;
    const res = NextResponse.json({ ok: true, data });
    setClienteCookie(res, u.id);
    return res;
  } catch (e) {
    console.error('[Login] Error:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
