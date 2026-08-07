import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";
import { whereAlcance, puedeVerAgencia } from "@/lib/permisos";
import { generarCodigoPaquete } from "@/lib/codigo";
import { registrarIngresoEnvio } from "@/lib/contabilidad";

// Conversión libras → kilogramos.
const LB_A_KG = 0.453592;

// Calcula volumen (ft³ y m³) a partir de alto×largo×ancho en pulgadas.
// Devuelve null si falta alguno (las dimensiones son opcionales).
function calcVolumen(alto?: number | string, largo?: number | string, ancho?: number | string): { ft3: number; m3: number } | null {
  const a = Number(alto), l = Number(largo), n = Number(ancho);
  if (!a || !l || !n || isNaN(a) || isNaN(l) || isNaN(n) || a <= 0 || l <= 0 || n <= 0) return null;
  const pulg3 = a * l * n;                 // pulgadas cúbicas
  const ft3 = pulg3 / 1728;                // 1 ft³ = 1728 in³
  const m3 = ft3 * 0.0283168;              // 1 ft³ = 0.0283168 m³
  return { ft3: Math.round(ft3 * 100) / 100, m3: Math.round(m3 * 10000) / 10000 };
}

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
  try {
    const s = await getSession(request);
    if (!s) return errorResponse("No autenticado", 401);
    const body = await request.json().catch(() => ({}));

    let { agenciaId, clienteId, formaPago } = body;
    // Auto-resolver agenciaId si viene vacío: tomar la primera agencia activa.
    // (El formulario a veces no la carga si /api/agencias falla en el navegador.)
    if (!agenciaId) {
      const primera = await db.agencia.findFirst({ where: { activa: true }, orderBy: { creado: "asc" } });
      if (primera) agenciaId = primera.id;
    }
    if (!agenciaId || !body.remitente || !body.destinatario) {
      // Diagnóstico: contar agencias para ver si la DB tiene datos.
      let diag = "";
      try { const c = await db.agencia.count(); diag = ` (agencias en DB: ${c})`; } catch (e:any) { diag = ` (count error: ${e.message?.slice(0,100)})`; }
      return errorResponse(`agenciaId, remitente y destinatario son requeridos${diag}`, 400);
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

    // Verificar que la agencia existe antes de crear (diagnóstico FK).
    const agCheck = await db.agencia.findUnique({ where: { id: agenciaId }, select: { id: true, nombre: true } });
    if (!agCheck) {
      const total = await db.agencia.count();
      return errorResponse(`La agencia ${agenciaId} no existe en la BD (hay ${total} agencias). Recargá la página /nuevo-paquete para refrescar.`, 400);
    }

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
      alto: body.alto ? Number(body.alto) : null,
      largo: body.largo ? Number(body.largo) : null,
      ancho: body.ancho ? Number(body.ancho) : null,
      // El volumen se calcula automáticamente de las dimensiones (pulgadas → ft³ → m³).
      // Si se manda explícito (caso edge), se respeta.
      volumenM3: body.volumenM3
        ? Number(body.volumenM3)
        : calcVolumen(body.alto, body.largo, body.ancho)?.m3 ?? null,
      volumenFt3: body.volumenFt3
        ? Number(body.volumenFt3)
        : calcVolumen(body.alto, body.largo, body.ancho)?.ft3 ?? null,
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
  } catch (e: any) {
    // Devolver el error exacto para diagnóstico (temporal, quitar en producción estable).
    console.error("POST /api/paquetes error:", e);
    return errorResponse(
      `Error interno: ${e?.message?.slice(0, 250) || String(e)}`,
      500,
    );
  }
}
