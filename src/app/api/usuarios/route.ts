import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse, hashPassword } from "@/lib/auth";
import { esAdmin, whereAlcance } from "@/lib/permisos";

// GET /api/usuarios — admin ve todos; agencia ve los de su alcance.
export async function GET(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const where = esAdmin(s) ? {} : await whereAlcance(s);
  const usuarios = await db.usuario.findMany({
    where, select: { id: true, usuario: true, nombre: true, rol: true, agenciaId: true, activo: true, creado: true },
    orderBy: { creado: "desc" },
  });
  return jsonResponse({ usuarios });
}

// POST /api/usuarios — solo admin crea usuarios.
export async function POST(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  if (!esAdmin(s)) return errorResponse("Solo el administrador puede crear usuarios", 403);
  const body = await request.json().catch(() => ({}));
  const { usuario, password, nombre, rol, agenciaId, activo } = body;
  if (!usuario || !password || !nombre) return errorResponse("usuario, password y nombre requeridos", 400);
  const existe = await db.usuario.findFirst({ where: { usuario: String(usuario).toLowerCase() } });
  if (existe) return errorResponse("El usuario ya existe", 409);
  const u = await db.usuario.create({
    data: {
      usuario: String(usuario).toLowerCase(),
      passwordHash: await hashPassword(String(password)),
      nombre, rol: rol || "operario",
      agenciaId: agenciaId || null,
      activo: activo !== undefined ? !!activo : true,
    },
    select: { id: true, usuario: true, nombre: true, rol: true, agenciaId: true, activo: true },
  });
  return jsonResponse({ usuario: u }, 201);
}
