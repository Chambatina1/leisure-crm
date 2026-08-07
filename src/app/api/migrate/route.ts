import { NextResponse } from "next/server";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

// ════════════════════════════════════════════════════════════════════════════
// /api/migrate — Fuerza la sincronización del schema Prisma + seed.
//
// Ejecuta:
//   1. prisma db push (crea/actualiza todas las tablas y columnas)
//   2. seed (crea agencias, usuarios, config base)
//   3. verifica que las tablas existan y tengan datos
//
// Público durante desarrollo. Útil cuando la DB está vacía o desactualizada.
// ════════════════════════════════════════════════════════════════════════════
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const log: string[] = [];
  try {
    log.push(`Entorno: RENDER=${process.env.RENDER || "no"} · NODE=${process.version}`);
    log.push(`/data existe: ${existsSync("/data")} · /tmp existe: ${existsSync("/tmp")}`);
    const dbData = "/data/dev.db";
    const dbTmp = "/tmp/dev.db";
    log.push(`/data/dev.db existe: ${existsSync(dbData)} · /tmp/dev.db existe: ${existsSync(dbTmp)}`);

    // 1. db push (crea todas las tablas y columnas)
    log.push("▶ Ejecutando prisma db push…");
    try {
      const out1 = execSync("npx prisma db push --accept-data-loss 2>&1", {
        encoding: "utf8",
        timeout: 45000,
      });
      const clean1 = out1.replace(/\x1b\[[0-9;]*m/g, "").split("\n").filter(Boolean);
      log.push(clean1.slice(-3).join(" | "));
    } catch (e: any) {
      log.push(`✗ db push falló: ${e.message?.slice(0, 200)}`);
    }

    // 2. generate
    log.push("▶ Ejecutando prisma generate…");
    try {
      execSync("npx prisma generate 2>&1", { encoding: "utf8", timeout: 30000 });
      log.push("✓ generate OK");
    } catch (e: any) {
      log.push(`✗ generate falló: ${e.message?.slice(0, 200)}`);
    }

    // 3. seed
    log.push("▶ Ejecutando seed…");
    try {
      const outSeed = execSync("npx tsx prisma/seed.ts 2>&1", { encoding: "utf8", timeout: 45000 });
      const cleanSeed = outSeed.replace(/\x1b\[[0-9;]*m/g, "").split("\n").filter(Boolean);
      log.push(cleanSeed.slice(-3).join(" | "));
    } catch (e: any) {
      log.push(`✗ seed falló: ${e.message?.slice(0, 200)}`);
    }

    // 4. verificar
    log.push("▶ Verificando tablas…");
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    try {
      const agencias = await prisma.agencia.count();
      const usuarios = await prisma.usuario.count();
      const paquetes = await prisma.paquete.count();
      log.push(`✓ Agencias: ${agencias} · Usuarios: ${usuarios} · Paquetes: ${paquetes}`);
    } catch (e: any) {
      log.push(`✗ verificación falló: ${e.message?.slice(0, 200)}`);
    }
    await prisma.$disconnect();

    return NextResponse.json({ ok: true, log });
  } catch (e: any) {
    log.push(`💥 ERROR: ${e.message?.slice(0, 300)}`);
    return NextResponse.json({ ok: false, log }, { status: 500 });
  }
}
