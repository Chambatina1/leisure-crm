import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonResponse, errorResponse, getSession } from "@/lib/auth";
import { esAdmin } from "@/lib/permisos";

// GET /api/admin/rastreador — Vista del rastreador central del admin.
// Todos los eventos GPS recientes de todas las agencias + paquetes en tránsito.
export async function GET(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  if (!esAdmin(s)) return errorResponse("Prohibido: solo administrador", 403);

  const { searchParams } = new URL(request.url);
  const agenciaId = searchParams.get("agenciaId");
  const soloGps = searchParams.get("gps") === "1";

  // Paquetes en tránsito (los que el admin "maneja/rastrea")
  const whereTr: Record<string, unknown> = { estado: { in: ["en_transito", "en_almacen"] } };
  if (agenciaId) whereTr.agenciaId = agenciaId;
  const enTransito = await db.paquete.findMany({
    where: whereTr,
    include: { agencia: { select: { nombre: true } }, eventos: { orderBy: { ts: "desc" }, take: 1 } },
    orderBy: { ultimoEscaneo: "desc" },
    take: 200,
  });

  // Eventos GPS recientes (todos los que tienen ubicación)
  const whereEv: Record<string, unknown> = { lat: { not: null }, lng: { not: null } };
  if (agenciaId) whereEv.paquete = { agenciaId };
  const eventosGps = await db.evento.findMany({
    where: whereEv,
    orderBy: { ts: "desc" },
    take: soloGps ? 500 : 100,
    include: { paquete: { select: { codigo: true, destinatario: true, destino: true, estado: true, agenciaId: true, agencia: { select: { nombre: true } } } } },
  });

  return jsonResponse({ enTransito, eventosGps });
}
