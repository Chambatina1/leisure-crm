// ════════════════════════════════════════════════════════════════════════════
// prebuild.mjs — Fuerza SQLite embebida para que la app ande SIN Postgres.
// La BD vive en /data/dev.db (volumen persistente de Render) o ./dev.db.
// Esto permite que la app arranque sola, sin vincular una base externa.
// (Para producción real con múltiples instancias, migrar a PostgreSQL después.)
// ════════════════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

// Render (plan Free) no tiene disco persistente, pero /tmp siempre es escribible.
// Usamos /tmp/dev.db en producción y ./dev.db en desarrollo local.
const PROD_DIR = "/tmp";
const useProd = existsSync(PROD_DIR) && process.env.RENDER;
const DATA_DIR = useProd ? PROD_DIR : ".";
try { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); } catch {}

const SCHEMA_PATH = "prisma/schema.prisma";
const provider = "sqlite";
const dbUrl = `file:${DATA_DIR}/dev.db`;

let schema = readFileSync(SCHEMA_PATH, "utf8");
schema = schema.replace(
  /datasource db \{\s*provider = "[a-z]+"\s*url\s*=\s*env\("DATABASE_URL"\)/,
  `datasource db {\n  provider = "${provider}"\n  url      = "${dbUrl}"`
);
writeFileSync(SCHEMA_PATH, schema);
console.log(`✓ Prisma provider forzado a: ${provider}`);
console.log(`  url: ${dbUrl}`);
