import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonResponse, errorResponse, getSession } from "@/lib/auth";
import { esAdmin, whereAlcance, idsAlcance } from "@/lib/permisos";
import { resumen } from "@/lib/contabilidad";

// GET /api/dashboard — KPIs + últimos paquetes + eventos GPS (rastreo general).
// Para admin: consolidado de TODAS las agencias.
// Para agencia: solo su scope.
export async function GET(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const where = await whereAlcance(s);

  const [paquetes, enTransito, entregados, montoAgg] = await Promise.all([
    db.paquete.count({ where }),
    db.paquete.count({ where: { ...where, estado: "en_transito" } }),
    db.paquete.count({ where: { ...where, estado: "entregado" } }),
    db.paquete.aggregate({ where, _sum: { monto: true } }),
  ]);
  const montoTotal = montoAgg._sum.monto || 0;

  // Últimos paquetes
  const ultimos = await db.paquete.findMany({
    where, orderBy: { creado: "desc" }, take: 8,
    include: { agencia: { select: { nombre: true } } },
  });

  // Resumen financiero (consolidado para admin)
  const finResumen = await resumen(esAdmin(s) ? null : s.agenciaId);

  // Eventos GPS recientes (para el mapa de rastreo general)
  const agIds = await idsAlcance(s);
  const eventosGps = await db.evento.findMany({
    where: { lat: { not: null }, lng: { not: null }, paquete: { agenciaId: { in: agIds } } },
    orderBy: { ts: "desc" }, take: 200,
    include: { paquete: { select: { codigo: true, destinatario: true, destino: true, agenciaId: true } } },
  });

  return jsonResponse({
    kpis: { paquetes, enTransito, entregados, montoTotal },
    ultimos,
    resumen: finResumen,
    eventosGps,
    scope: esAdmin(s) ? "global" : "agencia",
    esAdmin: esAdmin(s),
  });
}
