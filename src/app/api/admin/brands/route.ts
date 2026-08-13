import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";
import { esAdmin } from "@/lib/permisos";

// ════════════════════════════════════════════════════════════════════════════
// /api/admin/brands — gestión de brands/logos del chambatina.
// Todas las rutas requieren admin.
//
// GET    → lista TODOS los brands (incluye inactivos)
// POST   → crea un brand nuevo
// PATCH  → actualiza (activar/desactivar, orden, nombre, logo)
// DELETE → elimina un brand
// ════════════════════════════════════════════════════════════════════════════
export const dynamic = "force-dynamic";

async function checkAdmin(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return { error: errorResponse("No autenticado", 401) };
  if (!esAdmin(s)) return { error: errorResponse("Prohibido: solo administrador", 403) };
  return { session: s };
}

// GET — todos los brands (admin ve inactivos también)
export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request);
  if ("error" in auth) return auth.error;
  const brands = await db.brand.findMany({
    orderBy: { orden: "asc" },
  });
  return jsonResponse({ brands });
}

// POST — crear brand nuevo
export async function POST(request: NextRequest) {
  const auth = await checkAdmin(request);
  if ("error" in auth) return auth.error;
  const body = await request.json().catch(() => ({}));
  const { clave, nombre, logo, orden, activo } = body;

  if (!clave || !nombre || !logo) {
    return errorResponse("clave, nombre y logo son requeridos", 400);
  }

  const existe = await db.brand.findUnique({ where: { clave } });
  if (existe) return errorResponse("Ya existe una marca con esa clave", 409);

  const brand = await db.brand.create({
    data: {
      clave,
      nombre,
      logo,
      orden: Number(orden) || 0,
      activo: activo !== undefined ? !!activo : true,
    },
  });
  return jsonResponse({ brand }, 201);
}

// PATCH — actualizar brand (por id o clave)
export async function PATCH(request: NextRequest) {
  const auth = await checkAdmin(request);
  if ("error" in auth) return auth.error;
  const body = await request.json().catch(() => ({}));
  const { id, clave, nombre, logo, orden, activo } = body;

  if (!id && !clave) return errorResponse("id o clave requerido", 400);

  const where = id ? { id } : { clave: clave! };
  const data: Record<string, unknown> = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (logo !== undefined) data.logo = logo;
  if (orden !== undefined) data.orden = Number(orden);
  if (activo !== undefined) data.activo = !!activo;

  const brand = await db.brand.update({ where, data });
  return jsonResponse({ brand });
}

// DELETE — eliminar brand (por ?id= o ?clave=)
export async function DELETE(request: NextRequest) {
  const auth = await checkAdmin(request);
  if ("error" in auth) return auth.error;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const clave = searchParams.get("clave");

  if (!id && !clave) return errorResponse("id o clave requerido", 400);

  const where = id ? { id } : { clave: clave! };
  await db.brand.delete({ where });
  return jsonResponse({ ok: true });
}
