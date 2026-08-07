// ════════════════════════════════════════════════════════════════════════════
// seed-safe.js — Asegura que la base tenga los datos demo antes de arrancar.
// En el plan Free de Render, /tmp se resetea en cada deploy, así que corremos
// el seed siempre. El seed.ts usa deleteMany primero (no duplica datos).
// ════════════════════════════════════════════════════════════════════════════
const { execSync } = require("child_process");

try {
  console.log("▶ Asegurando datos demo (seed)…");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
  console.log("✅ Seed asegurado.");
} catch (e) {
  console.warn("⚠ Seed falló (no crítico, la app igual arranca):", e.message);
}
