import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonResponse, errorResponse, getSession } from "@/lib/auth";
import { esAdmin } from "@/lib/permisos";
import { resumen as resumenConta } from "@/lib/contabilidad";

// GET /api/admin/resumen — Dashboard de CONTROL del administrador.
// Solo admin. Vista consolidada de TODAS las agencias para supervisión.
export async function GET(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  if (!esAdmin(s)) return errorResponse("Prohibido: solo administrador", 403);

  // Totales globales
  const [totalPaquetes, totalAgencias, totalUsuarios, totalClientes] = await Promise.all([
    db.paquete.count(),
    db.agencia.count(),
    db.usuario.count(),
    db.cliente.count(),
  ]);

  // Por estado
  const porEstado = await db.paquete.groupBy({ by: ["estado"], _count: true });

  // Por agencia (con conteos)
  const agencias = await db.agencia.findMany({
    include: {
      _count: { select: { paquetes: true, usuarios: true, clientes: true } },
    },
    orderBy: { creado: "asc" },
  });

  // Actividad reciente (últimos 20 escaneos/eventos de cualquier agencia)
  const eventosRecientes = await db.evento.findMany({
    take: 20, orderBy: { ts: "desc" },
    include: { paquete: { select: { codigo: true, destinatario: true, agenciaId: true } } },
  });

  // Resumen contable consolidado
  const conta = await resumenConta(null);

  // Peso total
  const pesoAgg = await db.paquete.aggregate({ _sum: { peso: true } });

  return jsonResponse({
    kpis: {
      totalPaquetes, totalAgencias, totalUsuarios, totalClientes,
      pesoTotalLb: pesoAgg._sum.peso || 0,
    },
    porEstado,
    agencias: agencias.map(a => ({
      id: a.id, nombre: a.nombre, tipo: a.tipo, pais: a.pais,
      puedeCrearSubagencias: a.puedeCrearSubagencias,
      contabilidadActiva: a.contabilidadActiva,
      activa: a.activa,
      paquetes: a._count.paquetes,
      usuarios: a._count.usuarios,
      clientes: a._count.clientes,
    })),
    eventosRecientes,
    contabilidad: conta,
  });
}
