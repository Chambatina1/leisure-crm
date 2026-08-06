import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";

// GET /api/paquetes/[codigo]/qr — SVG del QR con la URL pública de rastreo.
// Pública (sin sesión) para que el cliente final pueda rastrear.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cod = codigo.toUpperCase();
  const p = await db.paquete.findUnique({ where: { codigo: cod } });
  if (!p) return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const urlRastreo = appUrl ? `${appUrl}/r/${cod}` : cod;

  const svg = await QRCode.toString(urlRastreo, {
    type: "svg", margin: 1, errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });
  return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
}
