import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/auth";

const ESTADOS_VALIDOS = ["en_origen", "en_transito", "en_almacen", "entregado"];

// POST /api/escaneo — el camionero escanea un QR; registra el evento GPS.
// El código puede venir limpio o como URL (se normaliza igual que en el frontend).
export async function POST(request: NextRequest) {
  const s = await getSession(request);
  if (!s) return errorResponse("No autenticado", 401);
  const body = await request.json().catch(() => ({}));
  let codigo = String(body.codigo || "").trim().toUpperCase();
  // Normalizar: quita URL/parámetros, deja solo A-Z 0-9 -
  codigo = codigo.replace(/^.*?\/R\//, "").replace(/^.*?[?&]C=/, "").replace(/[^A-Z0-9-]/g, "");
  if (!codigo) return errorResponse("código requerido", 400);

  const estado = String(body.estado || "en_transito").trim();
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return errorResponse("estado inválido. Válidos: " + ESTADOS_VALIDOS.join(", "), 400);
  }

  const p = await db.paquete.findUnique({ where: { codigo } });
  if (!p) return errorResponse("Paquete no encontrado: " + codigo, 404);

  const now = new Date();
  const [evento] = await db.$transaction([
    db.evento.create({
      data: {
        paqueteCodigo: codigo, estado,
        nota: String(body.nota || "Escaneo de cámara"),
        operarioId: s.userId,
        lat: typeof body.lat === "number" ? body.lat : null,
        lng: typeof body.lng === "number" ? body.lng : null,
        accuracy: typeof body.accuracy === "number" ? body.accuracy : null,
      },
    }),
    db.paquete.update({ where: { codigo }, data: { estado, ultimoEscaneo: now } }),
  ]);
  return jsonResponse({ ok: true, evento, paquete: { codigo, estado } }, 201);
}
