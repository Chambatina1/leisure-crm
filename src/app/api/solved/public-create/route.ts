import { db } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/auth";

// ════════════════════════════════════════════════════════════════════════════
// POST /api/solved/public-create — Crear envío desde el formulario público /enviar
// Sin login. Usa la primera agencia activa. Envía a Solved y devuelve el código.
// ════════════════════════════════════════════════════════════════════════════

const SOLVED_API_URL = "https://www.solved-vuelacargo.com/api/chambatina/v1";
const SOLVED_API_KEY = "6Nzx8CYjunLh7WcDCG82XA2ktXz97X";
const SOLVED_ENTERPRISE = "vuelacargo";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Buscar la agencia específica del link (no mezclar datos)
    const agUrl = body.agenciaUrl || "";
    let agencia;
    if (agUrl) {
      agencia = await db.agencia.findFirst({
        where: { OR: [{ id: agUrl }, { nombre: { contains: agUrl } }] }
      });
    }
    if (!agencia) {
      agencia = await db.agencia.findFirst({ where: { tipo: "matriz" } });
    }
    if (!agencia) {
      agencia = await db.agencia.findFirst({ where: { activa: true }, orderBy: { creado: "asc" } });
    }
    if (!agencia) return errorResponse("No hay agencia configurada", 500);

    const tipoEnvio = body.typecorrespond || "mail";
    const pesoLb = Number(body.peso) || 1;
    const pesoKg = pesoLb * 0.453592;
    const piezas = Number(body.piezas) || 1;

    const nombreParts = (body.destinatario || "").split(" ");
    const firstname = nombreParts[0] || "—";
    const surname = nombreParts.slice(1).join(" ");

    const solvedData = {
      enterprise: SOLVED_ENTERPRISE,
      print: { label: true, labelbag: true, awbhbl: true, billing: false },
      reserve: { createdby: "vuelacargo", typecorrespond: tipoEnvio, noorder: "", bagnumber: "", clasification: "ENVIO" },
      client: { firstname: (body.remitente || "—").split(" ")[0], surname: "", telephone: body.remitenteTel || "", street: "MIAMI, FL", province: "Florida", municipality: "Miami", mobile: body.remitenteTel || "" },
      shipper: { name: body.remitente || "—", address: "MIAMI, FL, USA" },
      consignee: {
        firstname, surname,
        identity: body.consignatarioCarnet || "",
        telephone: body.consignatarioTel || "",
        mobile: body.consignatarioTel || "",
        street: body.consignatarioCalle || "",
        province: body.consignatarioProvincia || "LA HABANA",
        municipality: body.consignatarioMunicipio || "",
      },
      goods: { length: 1, "0": { namegood: body.contenido || "PAQUETE", quantity: piezas, weight: pesoKg, priceshipping: 0, priceproduct: 0, deliverykind: "RECOGIDA ALMACEN", customcharge: "ORIGEN", shippingkind: tipoEnvio === "mail" ? "M" : "A" } },
    };

    const params = new URLSearchParams();
    params.append("apikey", SOLVED_API_KEY);
    params.append("enterprise", SOLVED_ENTERPRISE);
    params.append("typecorrespond", tipoEnvio);
    params.append("data", JSON.stringify(solvedData));

    const resp = await fetch(`${SOLVED_API_URL}/shipping/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const solved = await resp.json().catch(() => ({}));
    const solvedCode = Array.isArray(solved.code) ? solved.code[0] : solved.code;
    if (!solvedCode) return errorResponse("Solved no devolvió código: " + JSON.stringify(solved).slice(0,200), 502);

    // Guardar en BD
    const p = await db.paquete.create({
      data: {
        codigo: solvedCode, agenciaId: agencia.id,
        remitente: body.remitente || "—", remitenteTel: body.remitenteTel || null,
        destinatario: body.destinatario || "—",
        consignatarioCarnet: body.consignatarioCarnet || null,
        consignatarioTel: body.consignatarioTel || null,
        consignatarioCalle: body.consignatarioCalle || null,
        consignatarioMunicipio: body.consignatarioMunicipio || null,
        consignatarioProvincia: body.consignatarioProvincia || null,
        destino: body.consignatarioProvincia || "Cuba",
        peso: pesoLb, pesoKg: Math.round(pesoKg * 100) / 100,
        piezas, contenido: body.contenido || "PAQUETE",
        hawb: solvedCode, estado: "en_origen",
        eventos: { create: { estado: "en_origen", nota: "Creado via formulario público" } },
      },
    });

    return jsonResponse({ success: true, code: solvedCode, paquete: p }, 201);
  } catch (e: any) {
    return errorResponse(`Error: ${e?.message?.slice(0,200)}`, 500);
  }
}
