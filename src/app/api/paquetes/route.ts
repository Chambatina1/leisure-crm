import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";
import { whereAlcance, puedeVerAgencia } from "@/lib/permisos";
import { generarCodigoPaquete } from "@/lib/codigo";
import { registrarIngresoEnvio } from "@/lib/contabilidad";

// Conversión libras → kilogramos.
const LB_A_KG = 0.453592;

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

  const { agenciaId, clienteId, formaPago } = body;
  if (!agenciaId || !body.remitente || !body.destinatario) {
    return errorResponse("agenciaId, remitente y destinatario son requeridos", 400);
  }
  if (!(await puedeVerAgencia(s, agenciaId))) {
    return errorResponse("No puedes crear paquetes fuera de tu agencia", 403);
  }

  // Tarifa: la del form, o la default de Config.
  let tarifaNum = Number(body.tarifa);
  if (!tarifaNum || isNaN(tarifaNum)) {
    const cfg = await db.config.findUnique({ where: { key: "tarifaPorLb" } });
    tarifaNum = cfg ? Number(cfg.value) : 4.5;
  }
  const pesoNum = Number(body.peso) || 0;
  const monto = Math.round(pesoNum * tarifaNum * 100) / 100;
  const codigo = await generarCodigoPaquete();

  const p = await db.paquete.create({
    data: {
      codigo, agenciaId, clienteId: clienteId || null,
      // Remitente
      remitente: body.remitente,
      remitenteCarnet: body.remitenteCarnet || null,
      remitenteTel: body.remitenteTel || null,
      remitenteDir: body.remitenteDir || null,
      // Consignatario
      destinatario: body.destinatario,
      consignatarioCarnet: body.consignatarioCarnet || null,
      consignatarioTel: body.consignatarioTel || null,
      consignatarioCalle: body.consignatarioCalle || null,
      consignatarioEntre: body.consignatarioEntre || null,
      consignatarioMunicipio: body.consignatarioMunicipio || null,
      consignatarioProvincia: body.consignatarioProvincia || null,
      consignatarioCp: body.consignatarioCp || null,
      destino: body.destino || body.consignatarioProvincia || "Cuba",
      peso: pesoNum,
      pesoKg: Math.round(pesoNum * LB_A_KG * 100) / 100,
      piezas: Number(body.piezas) || 1,
      bultos: Number(body.bultos) || 0,
      volumenM3: body.volumenM3 ? Number(body.volumenM3) : null,
      volumenFt3: body.volumenFt3 ? Number(body.volumenFt3) : null,
      contenido: body.contenido || "Paquete",
      categoria: body.categoria || null,
      clasificacion: body.clasificacion || null,
      mercancias: body.mercancias || null,
      palet: body.palet || null,
      hawb: body.hawb || null,
      guiaBuque: body.guiaBuque || null,
      manifiesto: !!body.manifiesto,
      factura: body.factura || null,
      valorFact: body.valorFact ? Number(body.valorFact) : null,
      valorDocum: body.valorDocum ? Number(body.valorDocum) : null,
      valor: body.valor ? Number(body.valor) : null,
      valorPelig: body.valorPelig ? Number(body.valorPelig) : null,
      pagado: !!body.pagado,
      observaciones: body.observaciones || "",
      imagen: body.imagen || null,
      notas: body.notas || "",
      tarifa: tarifaNum, monto,
      estado: "en_origen",
      creadoPorId: s.userId,
      eventos: { create: { estado: "en_origen", nota: "Etiqueta creada", operarioId: s.userId } },
    },
    include: { eventos: true },
  });

  // Asiento contable: SOLO si la agencia tiene contabilidad activa (es opcional).
  const ag = await db.agencia.findUnique({ where: { id: agenciaId } });
  if (ag?.contabilidadActiva) {
    const pago = (formaPago || "efectivo") as "efectivo" | "banco" | "credito";
    try {
      await registrarIngresoEnvio({ codigo: p.codigo, agenciaId, monto, destinatario: p.destinatario }, pago);
    } catch (e) { console.error("Error registrando asiento de ingreso:", e); }
  }

  return jsonResponse({ paquete: p }, 201);
}
