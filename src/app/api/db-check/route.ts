import { NextResponse } from "next/server";

// Endpoint de diagnóstico minimal: no importa NADA del proyecto.
// Devuelve paso a paso qué falla.
export async function GET() {
  const pasos: string[] = [];
  try {
    pasos.push("1. modulo carga OK");
    pasos.push("2. env RENDER=" + (process.env.RENDER || "(no)"));
    pasos.push("3. env DATABASE_URL=" + (process.env.DATABASE_URL ? "set (" + process.env.DATABASE_URL.length + " chars)" : "(vacía)"));
    pasos.push("4. node version=" + process.version);

    pasos.push("5. importando node:fs...");
    const fs = require("node:fs");
    pasos.push("   fs OK. /tmp existe: " + fs.existsSync("/tmp"));
    pasos.push("   /tmp/dev.db existe: " + fs.existsSync("/tmp/dev.db"));
    pasos.push("   prisma/schema.prisma provider:");
    try {
      const sc = fs.readFileSync("prisma/schema.prisma", "utf8");
      const m = sc.match(/provider\s*=\s*"([^"]+)"/);
      pasos.push("   -> " + (m ? m[1] : "(no match)"));
      const u = sc.match(/url\s*=\s*"([^"]+)"/);
      pasos.push("   url -> " + (u ? u[1] : "(no match)"));
    } catch (e) { pasos.push("   error leyendo schema: " + e); }

    pasos.push("6. importando @prisma/client...");
    const { PrismaClient } = require("@prisma/client");
    pasos.push("   PrismaClient OK");
    const db = new PrismaClient();
    pasos.push("7. instanciado. contando usuarios...");
    const n = await db.usuario.count();
    pasos.push("   usuarios: " + n);
    await db.$disconnect();
    pasos.push("8. TODO OK ✅");
    return NextResponse.json({ ok: true, pasos });
  } catch (e) {
    pasos.push("💥 ERROR: " + (e instanceof Error ? e.message : String(e)));
    pasos.push("stack: " + (e instanceof Error ? e.stack?.slice(0, 800) : "(sin stack)"));
    return NextResponse.json({ ok: false, pasos }, { status: 500 });
  }
}
