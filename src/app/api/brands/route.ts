import { db } from "@/lib/db";
import { jsonResponse } from "@/lib/auth";

// ════════════════════════════════════════════════════════════════════════════
// GET /api/brands — lista de brands ACTIVOS, ordenados por `orden`.
// Público (sin auth) — lo consumen landing, etiqueta, BOL, HBL.
// ════════════════════════════════════════════════════════════════════════════
export const dynamic = "force-dynamic";

export async function GET() {
  const brands = await db.brand.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
    select: { id: true, clave: true, nombre: true, logo: true, orden: true },
  });
  return jsonResponse({ brands });
}
