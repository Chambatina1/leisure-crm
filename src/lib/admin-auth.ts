// ============================================================
// Autenticación de administrador (lado servidor)
// ------------------------------------------------------------
// - La contraseña vive SOLO en la variable de entorno ADMIN_PASSWORD.
// - Al iniciar sesión se emite una cookie httpOnly firmada con HMAC
//   (SESSION_SECRET), que el navegador envía sola en cada fetch.
// - Toda ruta de administración llama a requireAdmin(request).
// ============================================================
import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_COOKIE = 'amx_admin';
const SESSION_HOURS = 12;

function getSecret(): string | null {
  const s = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  return s && s.length >= 16 ? s : null;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** Comprueba la contraseña contra ADMIN_PASSWORD (sin valor por defecto). */
export function checkAdminPassword(password: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== 'string' || !password) return false;
  return safeEqual(password, expected);
}

/** Crea el valor de la cookie de sesión: "<expira>.<firma>". */
export function createSessionToken(): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const exp = String(Date.now() + SESSION_HOURS * 3600 * 1000);
  return `${exp}.${sign(`admin.${exp}`, secret)}`;
}

export function isAdminRequest(request: NextRequest): boolean {
  const secret = getSecret();
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!secret || !token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(`admin.${exp}`, secret));
}

/** Devuelve una respuesta 401 si no es admin; null si puede continuar. */
export function requireAdmin(request: NextRequest): NextResponse | null {
  if (isAdminRequest(request)) return null;
  return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

// ---- Límite simple de intentos de login (en memoria, por IP) ----
const intentos = new Map<string, { n: number; hasta: number }>();
const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;

export function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'desconocida'
  );
}

export function loginBloqueado(ip: string): boolean {
  const r = intentos.get(ip);
  if (!r) return false;
  if (r.hasta < Date.now()) {
    intentos.delete(ip);
    return false;
  }
  return r.n >= MAX_INTENTOS;
}

export function registrarFallo(ip: string) {
  const r = intentos.get(ip);
  if (!r || r.hasta < Date.now()) {
    intentos.set(ip, { n: 1, hasta: Date.now() + VENTANA_MS });
  } else {
    r.n += 1;
  }
}

export function limpiarFallos(ip: string) {
  intentos.delete(ip);
}
