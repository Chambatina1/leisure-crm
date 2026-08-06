import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";
import { whereAlcance } from "@/lib/permisos";

// GET /api/paquetes/[codigo] — detalle con historial de eventos (GPS).
// Accesible dentro del alcance. (La ruta /qr es pública vía middleware.)
export async function GET(request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const { codigo } = await params;
  const cod = codigo.toUpperCase();
  const where = await whereAlcance(s);
  const p = await db.paquete.findFirst({
    where: { codigo: cod, ...where },
    include: {
      eventos: { orderBy: { ts: "asc" } },
      agencia: { select: { nombre: true } },
    },
  });
  if (!p) return errorResponse("Paquete no encontrado", 404);
  return jsonResponse({ paquete: p });
}
