// ════════════════════════════════════════════════════════════════════════════
// Singleton de PrismaClient.
//
// IMPORTANTE: NO usamos el override `datasources` aquí. La URL de la DB viene
// del schema.prisma (que prebuild.mjs fijó en file:/tmp/dev.db o file:/data/dev.db)
// y se "hornea" en el cliente al hacer `prisma generate` durante el build.
// Pasar `datasources` por separado causaba que el singleton apuntara a una
// DB distinta de la que usa `prisma db push` (que lee el schema.prisma),
// produciendo "table does not exist" / FK violations.
// ════════════════════════════════════════════════════════════════════════════
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
