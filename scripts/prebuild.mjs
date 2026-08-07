// ════════════════════════════════════════════════════════════════════════════
// prebuild.mjs — Fuerza SQLite embebida con ruta ABSOLUTA para Render.
// La BD vive en /data/dev.db (disco persistente) o /tmp/dev.db (fallback).
// ════════════════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const PROD_DIR = existsSync("/data") ? "/data" : "/tmp";
const useProd = process.env.RENDER === "true" || existsSync("/tmp");
const DATA_DIR = useProd ? PROD_DIR : ".";
try { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); } catch {}

const SCHEMA_PATH = "prisma/schema.prisma";
const provider = "sqlite";
const dbUrl = `file:${DATA_DIR}/dev.db`;

let schema = readFileSync(SCHEMA_PATH, "utf8");
schema = schema.replace(
  /datasource db \{\s*provider = "[a-z]+"\s*url\s*=\s*(env\("DATABASE_URL"\)|"[^"]*")/,
  `datasource db {\n  provider = "${provider}"\n  url      = "${dbUrl}"`
);
writeFileSync(SCHEMA_PATH, schema);
console.log(`✓ Prisma provider forzado a: ${provider}`);
console.log(`  url: ${dbUrl}`);
// Escribir un archivo marca para que el runtime sepa qué URL se usó en build.
writeFileSync(".db-url", dbUrl);
console.log(`  marca escrita en .db-url`);
