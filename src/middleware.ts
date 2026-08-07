// ════════════════════════════════════════════════════════════════════════════
// Middleware — login automático como admin (MODO PRUEBA, sin pantalla de login).
// La landing "/" es pública. El CRM "/app" y las APIs quedan con sesión admin
// auto-creada para que puedas probar todo sin barreras.
// ════════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { getSession, signToken } from "@/lib/auth";

const PUBLIC_API = ["/api/auth/login", "/api/health", "/api/db-check"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname === "/login") {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/paquetes/") && pathname.endsWith("/qr")) {
    return NextResponse.next();
  }
  if (PUBLIC_API.includes(pathname)) {
    return NextResponse.next();
  }

  // Para el resto (/app y /api/*): asegurar sesión. Si no la tiene,
  // auto-login como admin (modo prueba). Busca el admin en la BD.
  let session = await getSession(request);
  if (!session) {
    // Crear token de admin. El agenciaId se resuelve en el handler si hace falta.
    const token = await signToken({
      userId: "auto-admin", usuario: "admin", rol: "admin", nombre: "Administrador", agenciaId: null,
    });
    const res = NextResponse.next();
    res.cookies.set("leisure_session", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    });
    // Re-evaluar: ahora hay sesión (auto).
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};
