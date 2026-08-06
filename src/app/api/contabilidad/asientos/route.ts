import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonResponse, errorResponse, getSession } from "@/lib/auth";
import { esAdmin } from "@/lib/permisos";
import { registrarAsiento } from "@/lib/contabilidad";

// GET /api/contabilidad/asientos — lista (consolidado para admin, su agencia para el resto).
export async function GET(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const agenciaId = esAdmin(s) ? null : s.agenciaId;
  const where = agenciaId ? { agenciaId } : {};
  const asientos = await db.asiento.findMany({ where, orderBy: { fecha: "desc" }, take: 100 });
  // Des-serializar lineas JSON.
  const out = asientos.map((a) => ({ ...a, lineas: JSON.parse(a.lineas) }));
  return jsonResponse({ asientos: out });
}

// POST /api/contabilidad/asientos — registrar asiento manual (doble entrada).
export async function POST(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const body = await request.json().catch(() => ({}));
  const lineas = Array.isArray(body.lineas) ? body.lineas : [];
  if (lineas.length < 2) return errorResponse("Se requieren al menos 2 líneas", 400);
  const agenciaId = esAdmin(s) ? (body.agenciaId || null) : s.agenciaId;
  try {
    const { id } = await registrarAsiento({
      agenciaId,
      descripcion: body.descripcion || "",
      lineas,
      paqueteCodigo: body.paqueteCodigo || null,
      fecha: body.fecha ? new Date(body.fecha) : undefined,
    });
    return jsonResponse({ ok: true, id }, 201);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : "Error al registrar asiento", 400);
  }
}
