// ════════════════════════════════════════════════════════════════════════════
// prebuild.mjs — Ajusta el provider de Prisma según el entorno.
//   - Detecta PostgreSQL automáticamente si DATABASE_URL empieza con "postgres"
//   - O si DATABASE_PROVIDER === "postgresql"
//   - Default: sqlite (desarrollo local)
// Así no depende de que las env vars se configuren perfecto en Render.
// ════════════════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync } from "node:fs";

const SCHEMA_PATH = "prisma/schema.prisma";
const url = process.env.DATABASE_URL || "";
const byEnv = process.env.DATABASE_PROVIDER || "";

let provider = "sqlite";
if (byEnv === "postgresql" || url.startsWith("postgres")) {
  provider = "postgresql";
}

let schema = readFileSync(SCHEMA_PATH, "utf8");
schema = schema.replace(
  /datasource db \{\s*provider = "[a-z]+"/,
  `datasource db {\n  provider = "${provider}"`
);
writeFileSync(SCHEMA_PATH, schema);
console.log(`✓ Prisma provider configurado a: ${provider}`);
console.log(`  (DATABASE_URL: ${url ? url.replace(/:([^:]+)@/, ":****@") : "(vacía)"})`);
