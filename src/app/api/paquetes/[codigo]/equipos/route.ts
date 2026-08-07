import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonResponse, errorResponse, getSession } from "@/lib/auth";
import { consultaAduana, resumenAduana } from "@/lib/aduana";

// GET /api/paquetes/[codigo]/equipos — lista equipos duraderos del paquete
//    ?aduana=1 → incluye el resumen de aduana (cuántos permite)
export async function GET(request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const { codigo } = await params;
  const cod = codigo.toUpperCase();
  const p = await db.paquete.findUnique({ where: { codigo: cod }, include: { equipos: true } });
  if (!p) return errorResponse("Paquete no encontrado", 404);

  const { searchParams } = new URL(request.url);
  const conAduana = searchParams.get("aduana") === "1";

  const resultado: Record<string, unknown> = { equipos: p.equipos };
  if (conAduana) {
    resultado.resumenAduana = resumenAduana(p.equipos.map(e => ({ tipo: e.tipo, valor: e.valor, peso: e.peso })));
    // Consulta por cada tipo: cuántos permite
    const tipos = [...new Set(p.equipos.map(e => e.tipo))];
    resultado.consultaTipos = tipos.map(t => consultaAduana(p.equipos.map(e => ({ tipo: e.tipo })), t));
  }
  return jsonResponse(resultado);
}

// POST /api/paquetes/[codigo]/equipos — añadir un equipo duradero al paquete
export async function POST(request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const { codigo } = await params;
  const cod = codigo.toUpperCase();
  const body = await request.json().catch(() => ({}));
  if (!body.tipo) return errorResponse("tipo requerido", 400);

  const p = await db.paquete.findUnique({ where: { codigo: cod }, include: { equipos: true } });
  if (!p) return errorResponse("Paquete no encontrado", 404);

  // Validar aduana: ¿se puede añadir uno más de este tipo?
  const consulta = consultaAduana(p.equipos.map(e => ({ tipo: e.tipo })), body.tipo);
  if (!consulta.permitido) {
    return errorResponse(consulta.mensaje, 409);
  }

  const eq = await db.equipoDuradero.create({
    data: {
      paqueteCodigo: cod,
      tipo: body.tipo,
      marca: body.marca || null,
      modelo: body.modelo || null,
      serial: body.serial || null,
      valor: Number(body.valor) || 0,
      peso: Number(body.peso) || 0,
    },
  });

  // Devolver resumen actualizado de aduana
  const equiposAct = await db.equipoDuradero.findMany({ where: { paqueteCodigo: cod } });
  return jsonResponse({ equipo: eq, resumenAduana: resumenAduana(equiposAct.map(e => ({ tipo: e.tipo, valor: e.valor, peso: e.peso }))) }, 201);
}

// DELETE /api/paquetes/[codigo]/equipos?id=... — eliminar un equipo
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const { codigo } = await params;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return errorResponse("id requerido", 400);
  await db.equipoDuradero.delete({ where: { id } });
  const equiposAct = await db.equipoDuradero.findMany({ where: { paqueteCodigo: codigo.toUpperCase() } });
  return jsonResponse({ ok: true, resumenAduana: resumenAduana(equiposAct.map(e => ({ tipo: e.tipo, valor: e.valor, peso: e.peso }))) });
}
