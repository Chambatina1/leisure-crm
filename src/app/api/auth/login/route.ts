import { NextRequest, NextResponse } from 'next/server';
import {
  rolPorPassword,
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
  let acceso: unknown;
  try {
    ({ password, acceso } = await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    console.error('[auth] ADMIN_PASSWORD no está configurada en el servidor');
    return NextResponse.json({ ok: false, error: 'Acceso no configurado' }, { status: 503 });
  }

  const rol = rolPorPassword(password);
  if (!rol) {
    registrarFallo(ip);
    return NextResponse.json({ ok: false, error: 'Contraseña incorrecta' }, { status: 401 });
  }

  // El botón Admin es solo para el acceso completo; la contraseña de tienda
  // se usa en "Administrar tienda" (dentro de la Tienda)
  if (rol === 'tienda' && acceso !== 'tienda') {
    return NextResponse.json(
      { ok: false, error: 'Esa contraseña es solo para "Administrar tienda", dentro de la Tienda.' },
      { status: 401 }
    );
  }

  const token = createSessionToken(rol);
  if (!token) {
    console.error('[auth] SESSION_SECRET/JWT_SECRET falta o es demasiado corto');
    return NextResponse.json({ ok: false, error: 'Acceso no configurado' }, { status: 503 });
  }

  limpiarFallos(ip);
  const res = NextResponse.json({ ok: true, rol });
  setSessionCookie(res, token);
  return res;
}
