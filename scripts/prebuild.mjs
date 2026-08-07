// ════════════════════════════════════════════════════════════════════════════
// prebuild.mjs — Fuerza SQLite embebida para que la app ande SIN Postgres.
// La BD vive en /data/dev.db (volumen persistente de Render) o ./dev.db.
// Esto permite que la app arranque sola, sin vincular una base externa.
// (Para producción real con múltiples instancias, migrar a PostgreSQL después.)
// ════════════════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

// Render: usamos el disco persistente /data (configurado en render.yaml).
// Si /data no existe (no se configuró el disco), caemos a /tmp como fallback.
const PROD_DIR = existsSync("/data") ? "/data" : "/tmp";
const useProd = process.env.RENDER === "true" || existsSync("/tmp");
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
