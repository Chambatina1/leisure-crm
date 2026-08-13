// ════════════════════════════════════════════════════════════════════════════
// Middleware — LOGIN REAL. Exige sesión válida para /app y /api/*.
// Si no hay sesión: redirige a /login (páginas) o 401 (API).
// Páginas públicas: landing, login, etiquetas, BOL (para choferes/clientes).
// ════════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const PUBLIC_API = ["/api/auth/login", "/api/auth/logout", "/api/health", "/api/db-check", "/api/migrate", "/api/brands", "/api/categorias"];

function isPublicApi(pathname: string): boolean {
  if (PUBLIC_API.includes(pathname)) return true;
  if (pathname.startsWith("/api/aduana/")) return true;
  if (pathname.startsWith("/api/paquetes/") && pathname.endsWith("/qr")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return NextResponse.next();
  if (pathname === "/" || pathname === "/login" || pathname === "/agencias") return NextResponse.next();
  if (pathname.startsWith("/etiqueta/") || pathname === "/bol" || pathname.startsWith("/r/")) return NextResponse.next();
  if (pathname.startsWith("/servicios/")) return NextResponse.next();
  if (pathname.startsWith("/api/") && isPublicApi(pathname)) return NextResponse.next();

  const session = await getSession(request);

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
    if (pathname === "/app" || pathname === "/app/") {
      return NextResponse.rewrite(new URL("/app/index.html", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    return NextResponse.next();
  }

  if (!session) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*", "/admin/:path*", "/envios/:path*", "/nuevo-paquete/:path*", "/hbl/:path*", "/portal/:path*", "/factura/:path*"],
};
