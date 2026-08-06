import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";
import { whereAlcance, puedeVerAgencia } from "@/lib/permisos";
import { generarCodigoPaquete } from "@/lib/codigo";
import { registrarIngresoEnvio } from "@/lib/contabilidad";

// GET /api/paquetes — lista según alcance, con filtros opcionales.
export async function GET(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado");
  const buscar = searchParams.get("buscar");

  const where: Record<string, unknown> = await whereAlcance(s);
  if (estado) where.estado = estado;
  if (buscar) {
    where.OR = [
      { codigo: { contains: buscar } },
      { remitente: { contains: buscar } },
      { destinatario: { contains: buscar } },
      { destino: { contains: buscar } },
    ];
  }
  const paquetes = await db.paquete.findMany({
    where, orderBy: { creado: "desc" }, take: 200,
    include: { agencia: { select: { nombre: true } } },
  });
  return jsonResponse({ paquetes });
}

// POST /api/paquetes — crea paquete + asiento de ingreso si no es a crédito.
export async function POST(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const body = await request.json().catch(() => ({}));
  const { agenciaId, clienteId, remitente, destinatario, destino, peso, contenido, notas, tarifa, formaPago } = body;
  if (!agenciaId || !remitente || !destinatario || !destino) {
    return errorResponse("agenciaId, remitente, destinatario y destino son requeridos", 400);
  }
  if (!(await puedeVerAgencia(s, agenciaId))) {
    return errorResponse("No puedes crear paquetes fuera de tu agencia", 403);
  }
  // Tarifa: la del form, o la default de Config.
  let tarifaNum = Number(tarifa);
  if (!tarifaNum || isNaN(tarifaNum)) {
    const cfg = await db.config.findUnique({ where: { key: "tarifaPorLb" } });
    tarifaNum = cfg ? Number(cfg.value) : 4.5;
  }
  const pesoNum = Number(peso) || 0;
  const monto = Math.round(pesoNum * tarifaNum * 100) / 100;
  const codigo = await generarCodigoPaquete();

  const p = await db.paquete.create({
    data: {
      codigo, agenciaId, clienteId: clienteId || null,
      remitente, destinatario, destino,
      peso: pesoNum, contenido: contenido || "Paquete", notas: notas || "",
      tarifa: tarifaNum, monto, estado: "en_origen",
      creadoPorId: s.userId,
      eventos: { create: { estado: "en_origen", nota: "Etiqueta creada", operarioId: s.userId } },
    },
    include: { eventos: true },
  });

  // Asiento contable automático según forma de pago.
  const pago = (formaPago || "efectivo") as "efectivo" | "banco" | "credito";
  try {
    await registrarIngresoEnvio({ codigo: p.codigo, agenciaId, monto, destinatario }, pago);
  } catch (e) {
    // Si falla el asiento, no revertimos el paquete pero avisamos en logs.
    console.error("Error registrando asiento de ingreso:", e);
  }

  return jsonResponse({ paquete: p }, 201);
}
