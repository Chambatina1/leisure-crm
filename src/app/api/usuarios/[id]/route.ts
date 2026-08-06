import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse, hashPassword } from "@/lib/auth";
import { esAdmin } from "@/lib/permisos";

// PUT /api/usuarios/[id] — solo admin.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  if (!esAdmin(s)) return errorResponse("Solo el administrador puede editar usuarios", 403);
  const { id } = await params;
  const u = await db.usuario.findUnique({ where: { id } });
  if (!u) return errorResponse("Usuario no encontrado", 404);
  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.nombre) data.nombre = body.nombre;
  if (body.rol) data.rol = body.rol;
  if (body.agenciaId !== undefined) data.agenciaId = body.agenciaId || null;
  if (body.activo !== undefined) data.activo = !!body.activo;
  if (body.usuario) data.usuario = String(body.usuario).toLowerCase();
  if (body.password) data.passwordHash = await hashPassword(String(body.password));
  const upd = await db.usuario.update({ where: { id }, data, select: { id: true, usuario: true, nombre: true, rol: true, agenciaId: true, activo: true } });
  return jsonResponse({ usuario: upd });
}

// DELETE /api/usuarios/[id] — solo admin.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  if (!esAdmin(s)) return errorResponse("Solo el administrador puede eliminar usuarios", 403);
  const { id } = await params;
  if (s.userId === id) return errorResponse("No puedes eliminar tu propia cuenta", 400);
  await db.usuario.delete({ where: { id } });
  return jsonResponse({ ok: true });
}
