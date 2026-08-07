// ════════════════════════════════════════════════════════════════════════════
// Middleware — MODO PRUEBA: auto-login como admin (sin pantalla de login).
// La landing "/" es pública. /app y /api/* quedan con sesión admin auto-creada.
// ════════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { getSession, signToken } from "@/lib/auth";

const PUBLIC_API = ["/api/auth/login", "/api/health", "/api/db-check"];
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

  // Resto de /api/*: si no hay sesión, setear cookie admin.
  if (pathname.startsWith("/api/")) {
    if (session) return NextResponse.next();
    // Setear cookie y dejar pasar (el handler la leerá en el SIGUIENTE request,
    // pero también aceptamos auto-admin: el handler usa getSession que ahora leerá
    // el token del header de cookie actual — que no incluye el recién seteado).
    // Para que el mismo request funcione, devolvemos 200 con un mensaje de "recarga".
    const res = NextResponse.json({ ok: true, message: "session-created" }, { status: 200 });
    return withSessionCookie(res, token);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};
