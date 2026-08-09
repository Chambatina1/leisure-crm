// ════════════════════════════════════════════════════════════════════════════
// Middleware — MODO PRUEBA: auto-login como admin (sin pantalla de login).
// La landing "/" es pública. /app y /api/* quedan con sesión admin auto-creada.
// ════════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { getSession, signToken } from "@/lib/auth";

const PUBLIC_API = ["/api/auth/login", "/api/health", "/api/db-check", "/api/migrate", "/api/brands"];
const WEEK = 60 * 60 * 24 * 7;

function withSessionCookie(res: NextResponse, token: string) {
  res.cookies.set("leisure_session", token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: WEEK,
  });
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Assets y login → libres.
  if (pathname.startsWith("/_next") || pathname === "/login") return NextResponse.next();

  // QR público sin sesión.
  if (pathname.startsWith("/api/paquetes/") && pathname.endsWith("/qr")) return NextResponse.next();
  if (PUBLIC_API.includes(pathname)) return NextResponse.next();
  // Catálogo de aduana → público.
  if (pathname.startsWith("/api/aduana/")) return NextResponse.next();

  // Etiquetas, Bill of Lading y páginas admin → públicos (auto-login en middleware).
  if (pathname.startsWith("/etiqueta/") || pathname === "/bol" || pathname.startsWith("/admin") || pathname.startsWith("/envios") || pathname.startsWith("/nuevo-paquete")) return NextResponse.next();

  // ¿Hay sesión válida?
  const session = await getSession(request);
  const token = await signToken({
    userId: "auto-admin", usuario: "admin", rol: "admin", nombre: "Administrador", agenciaId: null,
  });

  // /app: servir el CRM estático. Si /app sin barra final → reescribir al HTML.
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    let res: NextResponse;
    if (pathname === "/app") {
      // Reescribir a /app/index.html
      res = NextResponse.rewrite(new URL("/app/index.html", request.url));
    } else if (pathname === "/app/") {
      res = NextResponse.rewrite(new URL("/app/index.html", request.url));
    } else {
      res = NextResponse.next();
    }
    if (!session) return withSessionCookie(res, token);
    return res;
  }

  // Resto de /api/*: si no hay sesión, inyectar el token por header interno
  // Y dejar pasar el request al handler en la MISMA petición. Esto es crítico
  // para los POST (crear paquete, etc.) que antes devolvían "session-created"
  // y rompían el flujo del cliente.
  if (pathname.startsWith("/api/")) {
    if (session) return NextResponse.next();
    // Auto-login: setear cookie en la respuesta + pasar token al handler vía header.
    const headers = new Headers(request.headers);
    headers.set("x-auto-session", token);
    const nextRes = NextResponse.next({ request: { headers } });
    return withSessionCookie(nextRes, token);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};
