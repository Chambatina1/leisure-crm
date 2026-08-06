// ════════════════════════════════════════════════════════════════════════════
// Leisure CRM — Auth helpers
// JWT (jose, edge-compatible) + bcryptjs. Token en cookie httpOnly (no en
// localStorage) para mitigar robo por XSS. getSession funciona en route
// handlers y en middleware (jose es edge-friendly).
// ════════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "leisure_session";
const ALG = "HS256";
const ISSUER = "leisure-crm";
const AUDIENCE = "leisure-crm-app";
const EXPIRY = "7d";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    // En desarrollo permitimos un fallback determinista; en producción exigimos secreto real.
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET no definido o < 32 chars. Define uno en las variables de entorno.");
    }
    return new TextEncoder().encode("leisure-crm-dev-secret-change-in-production-32chars");
  }
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

// ── Hashing ──────────────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT ──────────────────────────────────────────────────────────────────────
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
  } catch {
    return null;
  }
}

// ── Cookie ───────────────────────────────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 días
};

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}
export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(COOKIE_NAME);
}
export function getTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(COOKIE_NAME)?.value;
}

// ── Sesión ───────────────────────────────────────────────────────────────────
export async function getSession(request: NextRequest): Promise<SessionUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

/** Exige sesión; devuelve 401 si no la hay. */
export async function requireUser(request: NextRequest): Promise<SessionUser | NextResponse> {
  const session = await getSession(request);
  if (!session) return errorResponse("No autenticado", 401);
  return session;
}

/** Exige rol admin. */
export async function requireAdmin(request: NextRequest): Promise<SessionUser | NextResponse> {
  const result = await requireUser(request);
  if (result instanceof NextResponse) return result;
  if (result.rol !== "admin") return errorResponse("Prohibido: se requiere administrador", 403);
  return result;
}

// ── Respuestas ───────────────────────────────────────────────────────────────
export function jsonResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
