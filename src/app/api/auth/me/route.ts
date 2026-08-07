import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, signToken } from "@/lib/auth";

// GET /api/auth/me — devuelve el usuario en sesión.
// MODO PRUEBA: si no hay sesión válida, crea una sesión para el admin real
// (busca el usuario admin en la BD) y lo devuelve. Así no hace falta login.
export async function GET(request: NextRequest) {
  let s = await getSession(request);

  if (!s || s.userId === "auto-admin") {
    // Resolver el admin real desde la BD.
    const admin = await db.usuario.findFirst({ where: { usuario: "admin" } });
    if (!admin) return jsonResponse({ usuario: null });
    // Crear token con el admin real y setearlo en la cookie.
    const token = await signToken({
      userId: admin.id, usuario: admin.usuario, rol: admin.rol,
      nombre: admin.nombre, agenciaId: admin.agenciaId,
    });
    const res = jsonResponse({ usuario: admin, agencia: admin.agenciaId ? await db.agencia.findUnique({ where: { id: admin.agenciaId } }) : null });
    res.cookies.set("leisure_session", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  }

  // Sesión válida: devolver datos frescos.
  const u = await db.usuario.findUnique({
    where: { id: s.userId },
    select: { id: true, usuario: true, nombre: true, rol: true, agenciaId: true },
  });
  if (!u) return jsonResponse({ usuario: null });
  const agencia = u.agenciaId ? await db.agencia.findUnique({ where: { id: u.agenciaId } }) : null;
  return jsonResponse({ usuario: u, agencia });
}
