// ════════════════════════════════════════════════════════════════════════════
// Middleware — protege /api/* (salvo auth/login, health y el QR público)
// y la página raíz de la app. Redirige a /login si no hay sesión.
// ════════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Rutas públicas: no requieren sesión.
const PUBLIC_API = ["/api/auth/login", "/api/health", "/api/db-check"];
const PUBLIC_PREFIXES = ["/api/paquetes/", "/login", "/_next", "/app"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Páginas de login y assets estáticos → acceso libre.
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // El QR de rastreo público: /api/paquetes/[codigo]/qr → permitir sin sesión.
  if (pathname.startsWith("/api/paquetes/") && pathname.endsWith("/qr")) {
    return NextResponse.next();
  }

  // Rutas de API públicas explícitas.
  if (PUBLIC_API.includes(pathname)) {
    return NextResponse.next();
  }

  // Resto de /api/* → requiere sesión.
  if (pathname.startsWith("/api/")) {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    return NextResponse.next();
  }

  // Página raíz "/" → si no hay sesión, ir a login; si la hay, a la app.
  if (pathname === "/") {
    const session = await getSession(request);
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
    // Sesión válida → servir la app desde /app/index.html
    return NextResponse.rewrite(new URL("/app/index.html", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/api/:path*"],
};
