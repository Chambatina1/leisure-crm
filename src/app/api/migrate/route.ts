import { NextResponse } from "next/server";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

// ════════════════════════════════════════════════════════════════════════════
// /api/migrate — Fuerza la sincronización del schema Prisma con la DB.
//
// Ejecuta `prisma db push` desde dentro del proceso y reporta el resultado.
// Útil cuando la DB está desactualizada (columnas faltantes) y el start.sh
// no la sincronizó bien.
//
// Público durante desarrollo. En producción real, proteger con admin.
// ════════════════════════════════════════════════════════════════════════════
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const log: string[] = [];
  try {
    log.push(`Entorno: RENDER=${process.env.RENDER || "no"} · NODE=${process.version}`);
    const dbPath = "/tmp/dev.db";
    log.push(`DB path: ${dbPath} · existe: ${existsSync(dbPath)}`);

    // 1. db push (crea todas las tablas y columnas)
    log.push("▶ Ejecutando prisma db push…");
    const out1 = execSync("npx prisma db push --accept-data-loss 2>&1", {
      encoding: "utf8",
      timeout: 45000,
    });
    log.push(out1.split("\n").filter(Boolean).slice(-4).join(" | "));

    // 2. generate
    log.push("▶ Ejecutando prisma generate…");
    const out2 = execSync("npx prisma generate 2>&1", {
      encoding: "utf8",
      timeout: 30000,
    });
    log.push(out2.split("\n").filter(Boolean).slice(-2).join(" | "));

    // 3. verificar que Paquete tiene las columnas nuevas
    log.push("▶ Verificando columnas de Paquete…");
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    try {
      const count = await prisma.paquete.count();
      log.push(`✓ Paquete.count() = ${count} — tabla OK`);
    } catch (e: any) {
      log.push(`✗ Paquete.count() FALLÓ: ${e.message?.slice(0, 200)}`);
    }
    await prisma.$disconnect();

    return NextResponse.json({ ok: true, log });
  } catch (e: any) {
    log.push(`💥 ERROR: ${e.message?.slice(0, 300)}`);
    if (e.stdout) log.push("stdout: " + String(e.stdout).slice(0, 300));
    if (e.stderr) log.push("stderr: " + String(e.stderr).slice(0, 300));
    return NextResponse.json({ ok: false, log }, { status: 500 });
  }
}
