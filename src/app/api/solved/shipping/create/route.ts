import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";
import { alcanceAgencias, puedeVerAgencia } from "@/lib/permisos";

// ════════════════════════════════════════════════════════════════════════════
// POST /api/solved/shipping/create
// Crea envío en Solved → obtiene código oficial → guarda en BD → muestra documentos
// ════════════════════════════════════════════════════════════════════════════

const SOLVED_API_URL = process.env.SOLVED_API_URL || "https://www.solved-vuelacargo.com/api/chambatina/v1";
const SOLVED_API_KEY = process.env.SOLVED_API_KEY || "6Nzx8CYjunLh7WcDCG82XA2ktXz97X";
const SOLVED_ENTERPRISE = "vuelacargo";

export async function POST(request: NextRequest) {
  try {
    const s = await getSession(request);
    if (!s) return errorResponse("No autenticado", 401);

    const body = await request.json().catch(() => ({}));

    // Resolver agencia
    let agenciaId = body.agenciaId || s.agenciaId;
    if (!agenciaId) {
      const ags = await alcanceAgencias(s);
      if (ags.length > 0) agenciaId = ags[0].id;
    }
    if (!agenciaId) return errorResponse("Sin agencia", 400);
    if (!(await puedeVerAgencia(s, agenciaId))) return errorResponse("Sin permiso", 403);

    const tipoEnvio = body.typecorrespond || "mail";
    const sender = body.sender || { name: body.remitente || "—", phone: body.remitenteTel || "" };
    const consignee = body.consignee || {
      firstname: (body.destinatario || "—").split(" ")[0],
      surname: (body.destinatario || "").split(" ").slice(1).join(" "),
      identity: body.consignatarioCarnet || "",
      telephone: body.consignatarioTel || "",
      mobile: body.consignatarioTel || "",
      street: body.consignatarioCalle || "",
      province: body.consignatarioProvincia || "LA HABANA",
      municipality: body.consignatarioMunicipio || "",
    };

    const pesoKg = Number(body.pesoKg || Number(body.peso) * 0.453592) || 1;
    const pesoLb = Number(body.peso) || pesoKg / 0.453592;

    // Payload para Solved (estructura EXACTA del ejemplo)
    const solvedData = {
      enterprise: SOLVED_ENTERPRISE,
      print: { label: true, labelbag: true, awbhbl: true, billing: !!body.generateInvoice },
      reserve: {
        createdby: "vuelacargo",
        typecorrespond: tipoEnvio,
        vesselguide: "",
        manifest: "",
        noorder: "", // Solved lo genera automaticamente
        bagnumber: "", // Solved lo genera automaticamente
        clasification: "ENVIO",
        observation: body.observaciones || "",
      },
      client: {
        firstname: sender.name,
        surname: "",
        identity: "",
        nacionality: "USA",
        telephone: sender.phone || "0000",
        street: body.remitenteDir || "MIAMI, FL",
        province: "Florida",
        municipality: "Miami",
        email: "",
        mobile: sender.phone || "0000",
      },
      shipper: {
        name: sender.name,
        address: body.remitenteDir || "MIAMI, FL, USA",
        email: "",
        nacionality: "USA",
        birthday: "",
        passport: "",
        dockind: "Pasaporte",
        state: "FL",
      },
      consignee: {
        firstname: consignee.firstname,
        surname: consignee.surname || "",
        identity: consignee.identity,
        nacionality: "CUB",
        telephone: consignee.telephone,
        street: consignee.street,
        province: consignee.province,
        municipality: consignee.municipality,
        email: "",
        mobile: consignee.mobile || consignee.telephone,
      },
      goods: {
        length: 1,
        "0": {
          reference: body.reference || "",
          namegood: body.contenido || "PAQUETE",
          category: body.categoria || "Miscelaneas",
          quantity: Number(body.piezas) || 1,
          weight: pesoKg,
          priceshipping: 0,
          priceproduct: 0,
          deliverykind: "RECOGIDA ALMACEN",
          customcharge: "ORIGEN",
          shippingkind: tipoEnvio === "mail" ? "M" : "A",
        },
      },
    };

    // Enviar a Solved
    const params = new URLSearchParams();
    params.append("apikey", SOLVED_API_KEY);
    params.append("enterprise", SOLVED_ENTERPRISE);
    params.append("typecorrespond", tipoEnvio);
    params.append("data", JSON.stringify(solvedData));

    const solvedResp = await fetch(`${SOLVED_API_URL}/shipping/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const solvedText = await solvedResp.text();
    let solved: any;
    try { solved = JSON.parse(solvedText); } catch { solved = { raw: solvedText }; }

    // Extraer código oficial
    const solvedCode = Array.isArray(solved.code) ? solved.code[0] : solved.code;

    if (!solvedCode) {
      return errorResponse("Solved no devolvió código. Respuesta: " + JSON.stringify(solved).slice(0, 300), 502);
    }

    // Verificar que no exista
    const yaExiste = await db.paquete.findUnique({ where: { codigo: solvedCode } });
    if (yaExiste) return errorResponse("Código ya existe: " + solvedCode, 409);

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
        destinatario: `${consignee.firstname} ${consignee.surname || ""}`.trim(),
        consignatarioCarnet: consignee.identity || null,
        consignatarioTel: consignee.telephone || null,
        consignatarioCalle: consignee.street || null,
        consignatarioMunicipio: consignee.municipality || null,
        consignatarioProvincia: consignee.province || null,
        destino: consignee.province || "Cuba",
        peso: pesoLb,
        pesoKg: Math.round(pesoKg * 100) / 100,
        piezas: Number(body.piezas) || 1,
        contenido: body.contenido || "PAQUETE",
        hawb: solvedCode,
        tarifa: tarifaNum, monto,
        estado: "en_origen",
        creadoPorId: s.userId,
        eventos: { create: { estado: "en_origen", nota: "Creado via Solved API: " + solvedCode, operarioId: s.userId } },
      },
    });

    return jsonResponse({
      success: true,
      paquete: p,
      code: solvedCode,
      solvedResponse: solved,
    }, 201);

  } catch (e: any) {
    console.error("Solved API error:", e);
    return errorResponse(`Error: ${e?.message?.slice(0, 300)}`, 500);
  }
}
