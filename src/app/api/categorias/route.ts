import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";
import { esAdmin } from "@/lib/permisos";

// GET /api/categorias — lista de categorías (público para que el formulario las lea)
export async function GET() {
  const cfg = await db.config.findUnique({ where: { key: "categorias" } });
  const categorias = cfg ? JSON.parse(cfg.value) : ["Comida","Ropa","Electrodoméstico","Medicina","Documentos","Higiene","Repuestos","Combustible","Vehículo","Miscelánea","Otro"];
  return jsonResponse({ categorias });
}

// POST /api/categorias — añadir categoría (solo admin)
export async function POST(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  if (!esAdmin(s)) return errorResponse("Solo administrador", 403);
  const body = await request.json().catch(() => ({}));
  const nueva = String(body.nombre || "").trim();
  if (!nueva) return errorResponse("Nombre requerido", 400);

  const cfg = await db.config.findUnique({ where: { key: "categorias" } });
  const cats: string[] = cfg ? JSON.parse(cfg.value) : ["Comida","Ropa","Electrodoméstico","Medicina","Documentos","Higiene","Repuestos","Combustible","Vehículo","Miscelánea","Otro"];
  if (!cats.includes(nueva)) cats.push(nueva);
  await db.config.upsert({ where: { key: "categorias" }, update: { value: JSON.stringify(cats) }, create: { key: "categorias", value: JSON.stringify(cats) } });
  return jsonResponse({ categorias: cats });
}

// DELETE /api/categorias?nombre=X — eliminar categoría (solo admin)
export async function DELETE(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  if (!esAdmin(s)) return errorResponse("Solo administrador", 403);
  const { searchParams } = new URL(request.url);
  const nombre = searchParams.get("nombre");
  if (!nombre) return errorResponse("nombre requerido", 400);

  const cfg = await db.config.findUnique({ where: { key: "categorias" } });
  const cats: string[] = cfg ? JSON.parse(cfg.value) : [];
  const filtradas = cats.filter(c => c !== nombre);
  await db.config.upsert({ where: { key: "categorias" }, update: { value: JSON.stringify(filtradas) }, create: { key: "categorias", value: JSON.stringify(filtradas) } });
  return jsonResponse({ categorias: filtradas });
}
