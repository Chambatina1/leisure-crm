import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";
import { alcanceAgencias, esAdmin } from "@/lib/permisos";

// GET /api/agencias — lista según alcance.
export async function GET(request: NextRequest) {
  try {
    const s = await getSession(request);
    if (!s) return errorResponse("No autenticado", 401);
    const ags = await alcanceAgencias(s);
    return jsonResponse({ agencias: ags });
  } catch (e: any) {
    console.error("GET /api/agencias error:", e);
    return errorResponse(`Error: ${e?.message?.slice(0, 200) || String(e)}`, 500);
  }
}

// POST /api/agencias — solo admin crea agencias de alto nivel.
export async function POST(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  if (!esAdmin(s)) return errorResponse("Solo el administrador puede crear agencias", 403);
  const body = await request.json().catch(() => ({}));
  const { nombre, tipo, padreId, direccion, ciudad, pais, telefono, puedeCrearSubagencias } = body;
  if (!nombre) return errorResponse("Nombre requerido", 400);
  const a = await db.agencia.create({
    data: {
      nombre, tipo: tipo || "agencia", padreId: padreId || null,
      direccion: direccion || null, ciudad: ciudad || null, pais: pais || null,
      telefono: telefono || null, logo: body.logo || null, puedeCrearSubagencias: !!puedeCrearSubagencias,
    },
  });
  return jsonResponse({ agencia: a }, 201);
}
