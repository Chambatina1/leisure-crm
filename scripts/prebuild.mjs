// ════════════════════════════════════════════════════════════════════════════
// prebuild.mjs — Cambia el provider de Prisma según el entorno.
//   - Desarrollo (sin DATABASE_PROVIDER): SQLite (file:./dev.db)
//   - Producción (DATABASE_PROVIDER=postgresql): PostgreSQL
// Así el mismo repo funciona en local (SQLite) y en Render (PostgreSQL).
// Basado en el patrón del proyecto golgily.
// ════════════════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync } from "node:fs";

const SCHEMA_PATH = "prisma/schema.prisma";
const provider = process.env.DATABASE_PROVIDER || "sqlite";

if (!["sqlite", "postgresql"].includes(provider)) {
  console.error(`✗ DATABASE_PROVIDER inválido: "${provider}". Usa "sqlite" o "postgresql".`);
  process.exit(1);
}

let schema = readFileSync(SCHEMA_PATH, "utf8");
schema = schema.replace(
  /datasource db \{\s*provider = "[a-z]+"/,
  `datasource db {\n  provider = "${provider}"`
);
writeFileSync(SCHEMA_PATH, schema);
console.log(`✓ Prisma provider configurado a: ${provider}`);
