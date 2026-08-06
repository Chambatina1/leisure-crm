import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";
import { whereAlcance } from "@/lib/permisos";

// DELETE /api/clientes/[id] — dentro del alcance.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const { id } = await params;
  const where = await whereAlcance(s);
  const c = await db.cliente.findFirst({ where: { id, ...where } });
  if (!c) return errorResponse("Cliente no encontrado", 404);
  await db.cliente.delete({ where: { id } });
  return jsonResponse({ ok: true });
}
