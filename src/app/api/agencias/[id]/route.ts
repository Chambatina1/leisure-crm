import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";
import { esAdmin, puedeVerAgencia } from "@/lib/permisos";

// GET /api/agencias/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const { id } = await params;
  const a = await db.agencia.findUnique({ where: { id } });
  if (!a) return errorResponse("Agencia no encontrada", 404);
  if (!(await puedeVerAgencia(s, a.id))) return errorResponse("Prohibido", 403);
  return jsonResponse({ agencia: a });
}

// PUT /api/agencias/[id] — admin edita cualquier campo; agencia con permiso
// solo sus subagencias propias (sin tocar puedeCrearSubagencias/tipo/padre).
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const { id } = await params;
  const a = await db.agencia.findUnique({ where: { id } });
  if (!a) return errorResponse("Agencia no encontrada", 404);
  const body = await request.json().catch(() => ({}));

  let data: Record<string, unknown> = {};
  if (esAdmin(s)) {
    data = {
      nombre: body.nombre ?? a.nombre,
      tipo: body.tipo ?? a.tipo,
      padreId: body.padreId !== undefined ? (body.padreId || null) : a.padreId,
      direccion: body.direccion ?? a.direccion,
      ciudad: body.ciudad ?? a.ciudad,
      pais: body.pais ?? a.pais,
      telefono: body.telefono ?? a.telefono,
      logo: body.logo !== undefined ? body.logo : a.logo,
      puedeCrearSubagencias: body.puedeCrearSubagencias !== undefined ? !!body.puedeCrearSubagencias : a.puedeCrearSubagencias,
      activa: body.activa !== undefined ? !!body.activa : a.activa,
    };
  } else {
    // No-admin: solo puede editar si es una subagencia propia.
    if (!s.agenciaId || a.padreId !== s.agenciaId) return errorResponse("Prohibido", 403);
    data = {
      nombre: body.nombre ?? a.nombre,
      direccion: body.direccion ?? a.direccion,
      ciudad: body.ciudad ?? a.ciudad,
      pais: body.pais ?? a.pais,
      telefono: body.telefono ?? a.telefono,
      logo: body.logo !== undefined ? body.logo : a.logo,
    };
  }
  const upd = await db.agencia.update({ where: { id }, data });
  return jsonResponse({ agencia: upd });
}

// DELETE /api/agencias/[id] — solo admin.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  if (!esAdmin(s)) return errorResponse("Solo el administrador puede eliminar agencias", 403);
  const { id } = await params;
  await db.agencia.delete({ where: { id } });
  return jsonResponse({ ok: true });
}
