import { NextRequest } from "next/server";
import { jsonResponse, errorResponse, getSession } from "@/lib/auth";
import { esAdmin, idsAlcance } from "@/lib/permisos";
import { mayor, resumen, CUENTAS } from "@/lib/contabilidad";

// GET /api/contabilidad?modo=mayor|resumen
export async function GET(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const { searchParams } = new URL(request.url);
  const modo = searchParams.get("modo") || "resumen";
  // agenciaId: null = consolidado (solo admin). Un no-admin siempre ve su scope.
  const agenciaId = esAdmin(s) ? null : s.agenciaId;

  if (modo === "mayor") return jsonResponse({ cuentas: CUENTAS, mayor: await mayor(agenciaId) });
  if (modo === "resumen") return jsonResponse({ resumen: await resumen(agenciaId) });
  return errorResponse("modo inválido (usa 'mayor' o 'resumen')", 400);
}
