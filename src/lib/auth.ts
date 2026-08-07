// ════════════════════════════════════════════════════════════════════════════
// Leisure CRM — Auth helpers
// JWT (jose) + bcryptjs. Token en cookie httpOnly.
// JWT_SECRET: si no está definido, genera uno aleatorio y lo persiste en /tmp
// (Render) o .jwt_secret (local) para que sobreviva entre requests del mismo deploy.
// ════════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "leisure_session";
const ALG = "HS256";
const ISSUER = "leisure-crm";
const AUDIENCE = "leisure-crm-app";
const EXPIRY = "7d";

// Fallback fijo (compatible con Edge runtime, que NO tiene node:fs).
// Esto permite que la app arranque sin configurar JWT_SECRET. Para producción
// real con seguridad, define JWT_SECRET (>=32 chars) en las variables de entorno.
const FALLBACK_SECRET = "leisure-exporting-llc-crm-fallback-secret-2026-change-me";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
    ? process.env.JWT_SECRET
    : FALLBACK_SECRET;
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  usuario: string;
  rol: string;
  nombre: string;
  agenciaId: string | null;
}
export interface SessionUser extends SessionPayload {
  iat?: number;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> { return bcrypt.hash(password, 12); }
export async function verifyPassword(password: string, hash: string): Promise<boolean> { return bcrypt.compare(password, hash); }

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}
export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { issuer: ISSUER, audience: AUDIENCE });
    return payload as unknown as SessionUser;
  } catch { return null; }
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
export function setSessionCookie(response: NextResponse, token: string) { response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS); }
export function clearSessionCookie(response: NextResponse) { response.cookies.delete(COOKIE_NAME); }
export function getTokenFromRequest(request: NextRequest): string | undefined {
  // Prioridad: cookie. Fallback: header interno inyectado por el middleware
  // cuando hace auto-login (necesario para que los POST funcionen en el mismo
  // request, ya que la cookie seteada en la respuesta no está disponible
  // hasta el siguiente request).
  return request.cookies.get(COOKIE_NAME)?.value
    ?? request.headers.get("x-auto-session") ?? undefined;
}

export async function getSession(request: NextRequest): Promise<SessionUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}
export async function requireUser(request: NextRequest): Promise<SessionUser | NextResponse> {
  const session = await getSession(request);
  if (!session) return errorResponse("No autenticado", 401);
  return session;
}
export async function requireAdmin(request: NextRequest): Promise<SessionUser | NextResponse> {
  const result = await requireUser(request);
  if (result instanceof NextResponse) return result;
  if (result.rol !== "admin") return errorResponse("Prohibido: se requiere administrador", 403);
  return result;
}

export function jsonResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
