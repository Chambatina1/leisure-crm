import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return jsonResponse({ usuario: null });
  // Devolver datos frescos de la BD (por si cambiaron rol/agencia).
  const u = await db.usuario.findUnique({
    where: { id: s.userId },
    select: { id: true, usuario: true, nombre: true, rol: true, agenciaId: true },
  });
  if (!u) return jsonResponse({ usuario: null });
  const agencia = u.agenciaId
    ? await db.agencia.findUnique({ where: { id: u.agenciaId } })
    : null;
  return jsonResponse({ usuario: u, agencia });
}
