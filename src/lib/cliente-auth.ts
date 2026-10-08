// ============================================================
// Sesión de cliente (comprador registrado y con correo verificado)
// Cookie httpOnly firmada: "<userId>.<expira>.<firma>", 30 días.
// ============================================================
import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const CLIENTE_COOKIE = 'amx_cliente';
const DIAS = 30;

function secreto(): string | null {
  const s = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  return s && s.length >= 16 ? s : null;
}
const firmar = (p: string, s: string) => createHmac('sha256', s).update(p).digest('base64url');

export function setClienteCookie(res: NextResponse, userId: number) {
  const s = secreto();
  if (!s) return;
  const exp = String(Date.now() + DIAS * 86400 * 1000);
  const valor = `${userId}.${exp}.${firmar(`cliente.${userId}.${exp}`, s)}`;
  res.cookies.set(CLIENTE_COOKIE, valor, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DIAS * 86400,
  });
}

export function clearClienteCookie(res: NextResponse) {
  res.cookies.set(CLIENTE_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

function idDeCookie(request: NextRequest): number | null {
  const s = secreto();
  const v = request.cookies.get(CLIENTE_COOKIE)?.value;
  if (!s || !v) return null;
  const [id, exp, sig] = v.split('.');
  if (!/^\d+$/.test(id || '') || !/^\d+$/.test(exp || '') || !sig) return null;
  if (Number(exp) < Date.now()) return null;
  const esperado = Buffer.from(firmar(`cliente.${id}.${exp}`, s));
  const recibido = Buffer.from(sig);
  if (esperado.length !== recibido.length || !timingSafeEqual(esperado, recibido)) return null;
  return Number(id);
}

export type Cliente = { id: number; nombre: string; email: string; telefono: string | null };

/** Cliente con sesión válida y cuenta activa, o null. */
export async function getCliente(request: NextRequest): Promise<Cliente | null> {
  const id = idDeCookie(request);
  if (!id) return null;
  const u = await db.user.findUnique({
    where: { id },
    select: { id: true, nombre: true, email: true, telefono: true, isActive: true },
  });
  if (!u || !u.isActive) return null;
  return { id: u.id, nombre: u.nombre, email: u.email, telefono: u.telefono };
}

/** Para rutas de compra: 401 si no hay cliente registrado. */
export function respuestaSinRegistro() {
  return NextResponse.json(
    { ok: false, error: 'Para comprar necesitas registrarte o iniciar sesión', requiereRegistro: true },
    { status: 401 }
  );
}
