import { NextRequest, NextResponse } from 'next/server';
import {
  checkAdminPassword,
  createSessionToken,
  setSessionCookie,
  clientIp,
  loginBloqueado,
  registrarFallo,
  limpiarFallos,
} from '@/lib/admin-auth';

// POST /api/auth/login — { password } → cookie de sesión httpOnly
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (loginBloqueado(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Demasiados intentos. Espera 15 minutos.' },
      { status: 429 }
    );
  }

  let password: unknown;
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    console.error('[auth] ADMIN_PASSWORD no está configurada en el servidor');
    return NextResponse.json({ ok: false, error: 'Acceso no configurado' }, { status: 503 });
  }

  if (!checkAdminPassword(password)) {
    registrarFallo(ip);
    return NextResponse.json({ ok: false, error: 'Contraseña incorrecta' }, { status: 401 });
  }

  const token = createSessionToken();
  if (!token) {
    console.error('[auth] SESSION_SECRET/JWT_SECRET falta o es demasiado corto');
    return NextResponse.json({ ok: false, error: 'Acceso no configurado' }, { status: 503 });
  }

  limpiarFallos(ip);
  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, token);
  return res;
}
