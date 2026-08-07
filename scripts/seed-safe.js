// ════════════════════════════════════════════════════════════════════════════
// seed-safe.js — Corre el seed SOLO si la base de datos está vacía.
// Idempotente: no duplica datos en cada redeploy.
// Se ejecuta desde "npm run start" antes de levantar Next.js.
// ════════════════════════════════════════════════════════════════════════════
const { PrismaClient } = require("@prisma/client");

async function main() {
  const db = new PrismaClient();
  try {
    const n = await db.usuario.count();
    if (n > 0) {
      console.log(`▶ La BD ya tiene ${n} usuario(s). Seed omitido.`);
      return;
    }
    console.log("▶ BD vacía → corriendo seed…");
    const { execSync } = require("child_process");
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
    console.log("✅ Seed completo.");
  } catch (e) {
    console.warn("⚠ No se pudo verificar/correr seed (no crítico):", e.message);
  } finally {
    await db.$disconnect();
  }
}

main();
