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

// PATCH /api/paquetes/[codigo] — editar datos del paquete.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const { codigo } = await params;
  const cod = codigo.toUpperCase();
  const body = await request.json().catch(() => ({}));

  // Construir data solo con los campos que vienen
  const data: Record<string, unknown> = {};
  const campos = [
    "remitente", "remitenteCarnet", "remitenteTel", "remitenteDir",
    "destinatario", "consignatarioCarnet", "consignatarioTel",
    "consignatarioCalle", "consignatarioEntre", "consignatarioMunicipio", "consignatarioProvincia",
    "destino", "contenido", "categoria", "notas", "observaciones",
    "peso", "piezas", "bultos", "pagado", "estado",
  ];
  for (const k of campos) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  // Recalcular pesoKg si cambia peso
  if (data.peso !== undefined) {
    const pesoNum = Number(data.peso) || 0;
    data.pesoKg = Math.round(pesoNum * 0.453592 * 100) / 100;
  }

  try {
    const p = await db.paquete.update({ where: { codigo: cod }, data });
    return jsonResponse({ paquete: p });
  } catch (e: any) {
    return errorResponse(`Error al editar: ${e?.message?.slice(0, 200) || String(e)}`, 500);
  }
}

// DELETE /api/paquetes/[codigo] — eliminar un envío.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const { codigo } = await params;
  const cod = codigo.toUpperCase();
  try {
    // Eliminar eventos primero (FK), luego el paquete
    await db.evento.deleteMany({ where: { paqueteCodigo: cod } });
    await db.paquete.delete({ where: { codigo: cod } });
    return jsonResponse({ ok: true });
  } catch (e: any) {
    return errorResponse(`Error al eliminar: ${e?.message?.slice(0, 200)}`, 500);
  }
}
