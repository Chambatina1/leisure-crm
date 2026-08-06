import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";
import { whereAlcance } from "@/lib/permisos";

// PUT /api/paquetes/[codigo]/estado — cambia estado + crea evento con GPS.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const { codigo } = await params;
  const cod = codigo.toUpperCase();
  const body = await request.json().catch(() => ({}));
  const estado = String(body.estado || "").trim();
  if (!estado) return errorResponse("estado requerido", 400);

  const where = await whereAlcance(s);
  const p = await db.paquete.findFirst({ where: { codigo: cod, ...where } });
  if (!p) return errorResponse("Paquete no encontrado", 404);

  const now = new Date();
  const [evento] = await db.$transaction([
    db.evento.create({
      data: {
        paqueteCodigo: cod, estado,
        nota: String(body.nota || "Cambio de estado"),
        operarioId: s.userId,
        lat: typeof body.lat === "number" ? body.lat : null,
        lng: typeof body.lng === "number" ? body.lng : null,
        accuracy: typeof body.accuracy === "number" ? body.accuracy : null,
      },
    }),
    db.paquete.update({ where: { codigo: cod }, data: { estado, ultimoEscaneo: now } }),
  ]);
  return jsonResponse({ ok: true, evento, paquete: { codigo: cod, estado } });
}
