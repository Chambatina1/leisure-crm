import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Endpoint temporal de diagnóstico (público). No exponer en producción real.
export async function GET() {
  try {
    const usuarios = await db.usuario.count();
    const agencias = await db.agencia.count();
    const paquetes = await db.paquete.count();
    // mostrar nombres de usuarios (sin hash)
    const lista = await db.usuario.findMany({ select: { usuario: true, rol: true, agenciaId: true } });
    return NextResponse.json({
      ok: true,
      counts: { usuarios, agencias, paquetes },
      usuarios: lista,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.slice(0, 500) : undefined,
    }, { status: 500 });
  }
}
