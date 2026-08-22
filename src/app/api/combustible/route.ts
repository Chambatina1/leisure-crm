import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";
import { whereAlcance } from "@/lib/permisos";
import QRCode from "qrcode";

// ════════════════════════════════════════════════════════════════════════════
// /api/combustible — Venta de combustible con ticket QR único
// GET: listar ventas | POST: crear venta + generar ticket + QR
// ════════════════════════════════════════════════════════════════════════════

const PRECIOS: Record<string, number> = {
  gasolina: 5.26,  // por litro (galón/3.785)
  diesel: 6.21,
  petroleo: 7.57,
};

// Generar número de ticket consecutivo
async function generarTicket(): Promise<string> {
  const ultima = await db.ventaCombustible.findFirst({
    orderBy: { creado: "desc" },
    select: { ticket: true },
  });
  let num = 1;
  if (ultima?.ticket) {
    const n = parseInt(ultima.ticket.replace("TICKET-", ""), 10);
    if (!isNaN(n)) num = n + 1;
  }
  return "TICKET-" + String(num).padStart(6, "0");
}

export async function GET(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const where = await whereAlcance(s);
  const ventas = await db.ventaCombustible.findMany({
    where,
    orderBy: { creado: "desc" },
    take: 100,
  });
  return jsonResponse({ ventas, precios: PRECIOS });
}

export async function POST(request: NextRequest) {
  try {
    const s = await getSession(request);
    if (!s) return errorResponse("No autenticado", 401);

    const body = await request.json().catch(() => ({}));
    const { tipo, litros, cliente, clienteCarnet, vehiculo, agenciaId } = body;

    // Resolver agencia
    let agId = agenciaId || s.agenciaId;
    if (!agId) {
      const ags = await db.agencia.findMany();
      if (ags.length > 0) agId = ags[0].id;
    }
    if (!agId) return errorResponse("Sin agencia", 400);

    const litrosNum = Number(litros) || 0;
    if (!litrosNum || litrosNum <= 0) return errorResponse("Litros requeridos", 400);

    const tipoValido = tipo in PRECIOS ? tipo : "gasolina";
    const precioLitro = PRECIOS[tipoValido];
    const total = Math.round(litrosNum * precioLitro * 100) / 100;

    // Generar ticket consecutivo
    const ticket = await generarTicket();

    // Crear venta
    const venta = await db.ventaCombustible.create({
      data: {
        ticket,
        tipo: tipoValido,
        litros: litrosNum,
        precioLitro,
        total,
        cliente: cliente || "Consumidor Final",
        clienteCarnet: clienteCarnet || null,
        vehiculo: vehiculo || null,
        agenciaId: agId,
      },
    });

    // Generar QR único del ticket
    const qrData = JSON.stringify({
      t: ticket,
      tipo: tipoValido,
      l: litrosNum,
      total,
      f: new Date().toISOString().slice(0, 10),
    });
    const qrSvg = await QRCode.toString(qrData, {
      type: "svg", margin: 1, errorCorrectionLevel: "M",
      width: 200,
    });

    return jsonResponse({
      success: true,
      venta,
      qr: qrSvg,
      ticket,
    }, 201);

  } catch (e: any) {
    return errorResponse(`Error: ${e?.message?.slice(0, 200)}`, 500);
  }
}
