import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";
import { whereAlcance, puedeVerAgencia } from "@/lib/permisos";

// GET /api/clientes — lista según alcance.
export async function GET(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const where = await whereAlcance(s);
  const clientes = await db.cliente.findMany({ where, orderBy: { creado: "desc" } });
  return jsonResponse({ clientes });
}

// POST /api/clientes
export async function POST(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const body = await request.json().catch(() => ({}));
  if (!body.nombre || !body.agenciaId) return errorResponse("nombre y agenciaId requeridos", 400);
  if (!(await puedeVerAgencia(s, body.agenciaId))) return errorResponse("No puedes crear clientes fuera de tu agencia", 403);
  const c = await db.cliente.create({
    data: { nombre: body.nombre, telefono: body.telefono || null, email: body.email || null, direccion: body.direccion || null, agenciaId: body.agenciaId },
  });
  return jsonResponse({ cliente: c }, 201);
}
