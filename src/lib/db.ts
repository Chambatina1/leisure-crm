// ════════════════════════════════════════════════════════════════════════════
// Singleton de PrismaClient. Evita agotar conexiones en desarrollo con
// hot-reload (patrón estándar de la documentación de Prisma).
// ════════════════════════════════════════════════════════════════════════════
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
