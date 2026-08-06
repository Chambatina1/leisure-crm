import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { signToken, setSessionCookie, verifyPassword, jsonResponse, errorResponse } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const usuario = String(body.usuario || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!usuario || !password) return errorResponse("Usuario y contraseña requeridos", 400);

  const u = await db.usuario.findFirst({ where: { usuario } });
  if (!u || !u.activo) return errorResponse("Credenciales inválidas", 401);

  const ok = await verifyPassword(password, u.passwordHash);
  if (!ok) return errorResponse("Credenciales inválidas", 401);

  const token = await signToken({
    userId: u.id, usuario: u.usuario, rol: u.rol, nombre: u.nombre, agenciaId: u.agenciaId,
  });
  const res = jsonResponse({
    usuario: { id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol, agenciaId: u.agenciaId },
  });
  setSessionCookie(res, token);
  return res;
}
