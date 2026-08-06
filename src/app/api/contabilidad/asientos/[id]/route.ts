import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonResponse, errorResponse, getSession } from "@/lib/auth";
import { esAdmin } from "@/lib/permisos";

// DELETE /api/contabilidad/asientos/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  if (!esAdmin(s)) return errorResponse("Solo el administrador puede eliminar asientos", 403);
  const { id } = await params;
  await db.asiento.delete({ where: { id } });
  return jsonResponse({ ok: true });
}
