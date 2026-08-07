// ════════════════════════════════════════════════════════════════════════════
// prebuild.mjs — Selecciona el provider correcto según el entorno.
//
// - Si DATABASE_URL está definida (producción con PostgreSQL): provider=postgresql.
// - Si RENDER=true pero sin DATABASE_URL: error (debes configurar PostgreSQL).
// - Desarrollo local sin DATABASE_URL: provider=sqlite, file:./dev.db.
// ════════════════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync } from "node:fs";

const SCHEMA_PATH = "prisma/schema.prisma";

const hasDbUrl = !!process.env.DATABASE_URL;
const isRender = process.env.RENDER === "true";

let provider, dbUrl;

if (hasDbUrl) {
  // Producción con PostgreSQL
  provider = "postgresql";
  dbUrl = `env("DATABASE_URL")`;
  console.log("✓ Provider: PostgreSQL (DATABASE_URL detectada)");
} else if (isRender) {
  // Render SIN DATABASE_URL — no debería pasar, pero caemos a SQLite en /tmp
  provider = "sqlite";
  dbUrl = `"file:/tmp/dev.db"`;
  console.log("⚠ Provider: SQLite en /tmp (¡Configura DATABASE_URL de PostgreSQL en Render!)");
} else {
  // Desarrollo local
  provider = "sqlite";
  dbUrl = `"file:./dev.db"`;
  console.log("✓ Provider: SQLite local (./dev.db)");
}

let schema = readFileSync(SCHEMA_PATH, "utf8");
schema = schema.replace(
  /datasource db \{\s*provider = "[a-z]+"\s*url\s*=\s*(env\("DATABASE_URL"\)|"[^"]*")/,
  `datasource db {\n  provider = "${provider}"\n  url      = ${dbUrl}`
);
writeFileSync(SCHEMA_PATH, schema);
console.log(`  url config: ${dbUrl}`);
