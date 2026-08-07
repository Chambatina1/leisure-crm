import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonResponse, errorResponse, getSession } from "@/lib/auth";
import { esAdmin } from "@/lib/permisos";

// GET /api/admin/envios — TODOS los envíos de TODAS las agencias (solo admin).
// Para supervisión y soporte. Soporta filtro por agencia y por estado.
export async function GET(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  if (!esAdmin(s)) return errorResponse("Prohibido: solo administrador", 403);

  const { searchParams } = new URL(request.url);
  const agenciaId = searchParams.get("agenciaId");
  const estado = searchParams.get("estado");
  const buscar = searchParams.get("buscar");

  const where: Record<string, unknown> = {};
  if (agenciaId) where.agenciaId = agenciaId;
  if (estado) where.estado = estado;
  if (buscar) {
    where.OR = [
      { codigo: { contains: buscar } },
      { remitente: { contains: buscar } },
      { destinatario: { contains: buscar } },
      { consignatarioCarnet: { contains: buscar } },
      { hawb: { contains: buscar } },
      { factura: { contains: buscar } },
    ];
  }

  const paquetes = await db.paquete.findMany({
    where, orderBy: { creado: "desc" }, take: 500,
    include: { agencia: { select: { nombre: true } } },
  });
  return jsonResponse({ paquetes });
}

// PATCH /api/admin/envios — Corregir/editar un envío (soporte del admin).
// Body: { codigo, ...campos a actualizar }
export async function PATCH(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  if (!esAdmin(s)) return errorResponse("Prohibido: solo administrador", 403);

  const body = await request.json().catch(() => ({}));
  const { codigo, ...campos } = body;
  if (!codigo) return errorResponse("codigo requerido", 400);

  // Recalcular pesoKg si cambió el peso
  if (campos.peso !== undefined) {
    campos.pesoKg = Math.round(Number(campos.peso) * 0.453592 * 100) / 100;
  }

  // Filtrar solo campos válidos (no permitir cambiar codigo)
  delete campos.codigo;
  delete campos.id;

  const p = await db.paquete.update({
    where: { codigo: String(codigo).toUpperCase() },
    data: campos,
  });
  return jsonResponse({ paquete: p });
}

// DELETE /api/admin/envios — Eliminar un envío (soporte del admin).
export async function DELETE(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  if (!esAdmin(s)) return errorResponse("Prohibido: solo administrador", 403);

  const { searchParams } = new URL(request.url);
  const codigo = (searchParams.get("codigo") || "").toUpperCase();
  if (!codigo) return errorResponse("codigo requer", 400);

  await db.paquete.delete({ where: { codigo } });
  return jsonResponse({ ok: true });
}
