import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse } from "@/lib/auth";

// GET /api/auth/me — devuelve el usuario actual o null.
// LOGIN REAL: si no hay sesión, devuelve { usuario: null }.
export async function GET(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return jsonResponse({ usuario: null });

  const u = await db.usuario.findUnique({
    where: { id: s.userId },
    select: { id: true, usuario: true, nombre: true, rol: true, agenciaId: true, activo: true },
  });
  if (!u) return jsonResponse({ usuario: null });

  let agencia = null;
  if (u.agenciaId) {
    agencia = await db.agencia.findUnique({ where: { id: u.agenciaId }, select: { id: true, nombre: true, tipo: true } });
  }
  return jsonResponse({ usuario: { ...u, agencia } });
}
