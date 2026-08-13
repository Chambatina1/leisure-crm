import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";
import { alcanceAgencias, puedeVerAgencia } from "@/lib/permisos";

// ════════════════════════════════════════════════════════════════════════════
// POST /api/solved/create-shipment
// Crea un envío en Solved y guarda el código oficial en nuestra BD.
//
// Flujo:
//   1. Recibe datos del envío desde el formulario
//   2. Los envía a Solved API (/shipping/create/)
//   3. Solved devuelve el código oficial + documentos
//   4. Guardamos en nuestra BD con el código de Solved como UNIQUE
//   5. Devuelve el código + URLs de documentos
// ════════════════════════════════════════════════════════════════════════════

const SOLVED_API_URL = process.env.SOLVED_API_URL || "https://www.solved-vuelacargo.com/api/chambatina/v1";
const SOLVED_API_KEY = process.env.SOLVED_API_KEY || "6Nzx8CYjunLh7WcDCG82XA2ktXz97X";
const SOLVED_ENTERPRISE = process.env.NODE_ENV === "production"
  ? (process.env.SOLVED_ENTERPRISE_PROD || "vuelacargo")
  : (process.env.SOLVED_ENTERPRISE_TEST || "vuelacargotest");

const LB_A_KG = 0.453592;

export async function POST(request: NextRequest) {
  try {
    const s = await getSession(request);
    if (!s) return errorResponse("No autenticado", 401);

    const body = await request.json().catch(() => ({}));
    const { shippingType, sender, consignee, packages: pkgList, generateInvoice = false, generateHBL = true } = body;

    // Resolver agenciaId
    let agenciaId = body.agenciaId || s.agenciaId;
    if (!agenciaId) {
      const ags = await alcanceAgencias(s);
      if (ags.length > 0) agenciaId = ags[0].id;
    }
    if (!agenciaId) return errorResponse("No se pudo determinar la agencia", 400);
    if (!(await puedeVerAgencia(s, agenciaId))) return errorResponse("Sin permiso para esta agencia", 403);

    // Validar tipo
    const allowedTypes = ["av", "cc", "mail"];
    const tipoEnvio = shippingType || "mail";
    if (!allowedTypes.includes(tipoEnvio)) return errorResponse("Tipo inválido. Usar: av, cc, mail", 400);

    if (!sender?.name || !consignee?.firstname) {
      return errorResponse("Faltan datos del remitente o consignatario", 400);
    }

    const pesoLb = Number(body.peso) || 1;
    const pesoTotalKg = pesoLb * LB_A_KG;
    const paquetes = pkgList || [{ quantity: 1, weight: pesoTotalKg, description: body.contenido || "PAQUETE" }];
    const piezasTotal = paquetes.reduce((sum: number, p: any) => sum + (Number(p.quantity) || 1), 0);

    // Payload para Solved
    const solvedPayload = {
      enterprise: SOLVED_ENTERPRISE,
      print: { label: true, labelbag: true, awbhbl: generateHBL, billing: generateInvoice },
      sender: { name: sender.name, phone: sender.phone || "" },
      consignee: {
        firstname: consignee.firstname,
        lastname: consignee.lastname || "",
        identity: consignee.identity || "",
        phone: consignee.phone || "",
        address: consignee.address || "",
        municipality: consignee.municipality || "",
        province: consignee.province || "",
      },
      packages: paquetes,
    };

    // Enviar a Solved (x-www-form-urlencoded)
    const params = new URLSearchParams();
    params.append("apikey", SOLVED_API_KEY);
    params.append("enterprise", SOLVED_ENTERPRISE);
    params.append("typecorrespond", tipoEnvio);
    params.append("data", JSON.stringify(solvedPayload));

    console.log("Enviando a Solved:", SOLVED_API_URL + "/shipping/create/");

    const solvedResponse = await fetch(`${SOLVED_API_URL}/shipping/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const solvedText = await solvedResponse.text();
    let solved: any;
    try { solved = JSON.parse(solvedText); } catch { solved = { raw: solvedText }; }

    console.log("Solved respondio:", solvedResponse.status, JSON.stringify(solved).slice(0, 300));

    if (!solvedResponse.ok) {
      return errorResponse(`Solved rechazo: ${solved.message || solved.error || solvedText.slice(0, 200)}`, 502);
    }

    // Extraer código oficial
    const solvedCode = Array.isArray(solved.code) ? solved.code[0] : solved.code;
    if (!solvedCode) {
      return errorResponse("Solved no devolvio un codigo de envio", 502);
    }

    // Verificar que no exista (UNIQUE)
    const yaExiste = await db.paquete.findUnique({ where: { codigo: solvedCode } });
    if (yaExiste) {
      return errorResponse("El codigo ya existe: " + solvedCode, 409);
    }

    // Tarifa
    let tarifaNum = Number(body.tarifa);
    if (!tarifaNum || isNaN(tarifaNum)) {
      const cfg = await db.config.findUnique({ where: { key: "tarifaPorLb" } });
      tarifaNum = cfg ? Number(cfg.value) : 4.5;
    }
    const monto = Math.round(pesoLb * tarifaNum * 100) / 100;

    // Guardar en BD con el código de Solved
    const p = await db.paquete.create({
      data: {
        codigo: solvedCode,
        agenciaId,
        remitente: sender.name,
        remitenteTel: sender.phone || null,
        destinatario: `${consignee.firstname} ${consignee.lastname || ""}`.trim(),
        consignatarioCarnet: consignee.identity || null,
        consignatarioTel: consignee.phone || null,
        consignatarioCalle: consignee.address || null,
        consignatarioMunicipio: consignee.municipuality || null,
        consignatarioProvincia: consignee.province || null,
        destino: consignee.province || "Cuba",
        peso: pesoLb,
        pesoKg: Math.round(pesoTotalKg * 100) / 100,
        piezas: piezasTotal,
        contenido: paquetes.map((pk: any) => pk.description).join(", "),
        tarifa: tarifaNum,
        monto,
        estado: "en_origen",
        creadoPorId: s.userId,
        eventos: { create: { estado: "en_origen", nota: "Envio creado via Solved API", operarioId: s.userId } },
      },
      include: { eventos: true },
    });

    return jsonResponse({
      success: true,
      paquete: p,
      code: solvedCode,
      documents: {
        label: solved.label ?? null,
        labelbag: solved.labelbag ?? null,
        hbl: solved.awbhtml ?? null,
        invoice: solved.billing ?? null,
        manifest: solved.manifest ?? null,
      },
      solvedResponse: solved,
    }, 201);

  } catch (e: any) {
    console.error("Error Solved:", e);
    return errorResponse(`Error: ${e?.message?.slice(0, 300) || String(e)}`, 500);
  }
}
