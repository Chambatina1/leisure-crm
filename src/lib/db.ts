// ════════════════════════════════════════════════════════════════════════════
// Singleton de PrismaClient. Evita agotar conexiones en desarrollo con
// hot-reload (patrón estándar de la documentación de Prisma).
//
// En producción (Render), forzamos la URL absoluta de la DB SQLite para que
// TODOS los requests apunten al mismo archivo. Sin esto, la URL relativa
// `file:./dev.db` se resuelve según el CWD del proceso y puede apuntar a
// archivos distintos (GET lee una DB, POST escribe otra → FK violation).
// ════════════════════════════════════════════════════════════════════════════
import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";

function getDbUrl(): string | undefined {
  // Si hay DATABASE_URL de Postgres, usarla (producción real).
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  // En Render: usar el disco persistente /data/dev.db (cae a /tmp si no hay disco).
  if (process.env.RENDER) {
    const dir = existsSync("/data") ? "/data" : "/tmp";
    return `file:${dir}/dev.db`;
  }
  // Local: la del .env o default ./dev.db
  return process.env.DATABASE_URL || undefined;
}

const url = getDbUrl();
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
    datasources: url ? { db: { url } } : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
