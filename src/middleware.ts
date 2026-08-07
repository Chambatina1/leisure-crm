// ════════════════════════════════════════════════════════════════════════════
// Middleware — protege /app (CRM) y /api/* (salvo rutas públicas).
// La landing "/" es pública.
// ════════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Rutas de API públicas.
const PUBLIC_API = ["/api/auth/login", "/api/health", "/api/db-check"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Assets estáticos y login → acceso libre.
  if (pathname.startsWith("/_next") || pathname === "/login") {
    return NextResponse.next();
  }

  // El QR público de rastreo: /api/paquetes/[codigo]/qr → sin sesión.
  if (pathname.startsWith("/api/paquetes/") && pathname.endsWith("/qr")) {
    return NextResponse.next();
  }

  // Otras rutas de API públicas explícitas.
  if (PUBLIC_API.includes(pathname)) {
    return NextResponse.next();
  }

  // Resto de /api/* → requiere sesión.
  if (pathname.startsWith("/api/")) {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    return NextResponse.next();
  }

  // /app (CRM estático) → requiere sesión; sin sesión va a /login.
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    const session = await getSession(request);
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Todo lo demás (incluida la landing "/") → público.
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};
