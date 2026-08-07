import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonResponse, errorResponse, getSession } from "@/lib/auth";
import { esAdmin } from "@/lib/permisos";

// GET /api/admin/analisis — Datos para gráficos y análisis del admin.
// Solo admin. Series temporales, distribución por agencia/estado, tendencias.
export async function GET(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  if (!esAdmin(s)) return errorResponse("Prohibido: solo administrador", 403);

  const ahora = new Date();
  const hace30 = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Envíos por día (últimos 30 días)
  const envios30 = await db.paquete.findMany({
    where: { creado: { gte: hace30 } },
    select: { creado: true, peso: true, monto: true, estado: true, agenciaId: true },
  });
  const porDia: Record<string, { count: number; peso: number; monto: number }> = {};
  for (const p of envios30) {
    const d = new Date(p.creado).toISOString().slice(0, 10);
    if (!porDia[d]) porDia[d] = { count: 0, peso: 0, monto: 0 };
    porDia[d].count++;
    porDia[d].peso += p.peso;
    porDia[d].monto += p.monto;
  }
  const serieDias = Object.entries(porDia)
    .map(([fecha, v]) => ({ fecha, ...v }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  // 2. Distribución por agencia (volumen)
  const agencias = await db.agencia.findMany({
    include: { _count: { select: { paquetes: true } } },
  });
  const porAgencia = agencias
    .filter(a => a._count.paquetes > 0)
    .map(a => ({ nombre: a.nombre, paquetes: a._count.paquetes }))
    .sort((a, b) => b.paquetes - a.paquetes);

  // 3. Distribución por estado
  const porEstado = await db.paquete.groupBy({ by: ["estado"], _count: true, _sum: { peso: true, monto: true } });

  // 4. Distribución por categoría de contenido
  const porCategoria = await db.paquete.groupBy({ by: ["categoria"], _count: true });

  // 5. Top destinos (provincias)
  const destinos = await db.paquete.groupBy({
    by: ["consignatarioProvincia"],
    _count: true,
    orderBy: { _count: { consignatarioProvincia: "desc" } },
    take: 10,
  });

  // 6. Tasa de entrega
  const total = await db.paquete.count();
  const entregados = await db.paquete.count({ where: { estado: "entregado" } });
  const enTransito = await db.paquete.count({ where: { estado: "en_transito" } });

  return jsonResponse({
    serieDias,
    porAgencia,
    porEstado: porEstado.map(e => ({ estado: e.estado, count: e._count, peso: e._sum.peso, monto: e._sum.monto })),
    porCategoria: porCategoria.map(c => ({ categoria: c.categoria || "Sin categoría", count: c._count })),
    porDestino: destinos.map(d => ({ provincia: d.consignatarioProvincia || "Sin especificar", count: d._count })),
    metricas: {
      total, entregados, enTransito,
      tasaEntrega: total ? Math.round((entregados / total) * 100) : 0,
    },
  });
}
