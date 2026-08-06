import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";
import { puedeCrearSubagenciaEn } from "@/lib/permisos";

// POST /api/agencias/[id]/subagencias — crea una subagencia bajo [id].
// Admin: bajo cualquiera. Agencia con permiso: solo bajo sí misma.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const { id } = await params;
  if (!(await puedeCrearSubagenciaEn(s, id))) {
    return errorResponse("No tienes permiso para crear subagencias aquí", 403);
  }
  const body = await request.json().catch(() => ({}));
  if (!body.nombre) return errorResponse("Nombre requerido", 400);
  const sub = await db.agencia.create({
    data: {
      nombre: body.nombre,
      tipo: "subagencia",
      padreId: id,
      direccion: body.direccion || null,
      ciudad: body.ciudad || null,
      pais: body.pais || null,
      telefono: body.telefono || null,
      // Una subagencia no hereda el permiso por defecto.
      puedeCrearSubagencias: false,
    },
  });
  return jsonResponse({ agencia: sub }, 201);
}
