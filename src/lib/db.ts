// ════════════════════════════════════════════════════════════════════════════
// Singleton de PrismaClient.
// La URL de la DB la define el schema.prisma (que prebuild.mjs ajusta según
// el entorno: PostgreSQL en producción, SQLite en desarrollo).
// ════════════════════════════════════════════════════════════════════════════
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
