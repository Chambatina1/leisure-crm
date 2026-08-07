import { NextResponse } from "next/server";
import { CATALOGO_EQUIPOS, REGLAS_ADUANA } from "@/lib/aduana";

// GET /api/aduana/catalogo — catálogo de equipos + reglas (público).
export async function GET() {
  return NextResponse.json({
    catalogo: CATALOGO_EQUIPOS,
    reglas: REGLAS_ADUANA,
  });
}
