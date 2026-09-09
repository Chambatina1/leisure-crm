import { db } from '@/lib/db';

// Auto-creación de la tabla de solicitudes (si aún no existe).
// Elimina la dependencia del Shell de Render: el primer uso la crea.
const YA_CREATADA = { ok: false };

export async function asegurarTablaSolicitudes(): Promise<void> {
  if (YA_CREATADA.ok) return;
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SolicitudCombustible" (
        "id" SERIAL PRIMARY KEY,
        "numero" TEXT NOT NULL UNIQUE,
        "nombreComprador" TEXT NOT NULL,
        "telefonoComprador" TEXT NOT NULL,
        "emailComprador" TEXT,
        "ciBeneficiario" TEXT NOT NULL,
        "nombreBeneficiario" TEXT NOT NULL,
        "telefonoCuba" TEXT NOT NULL,
        "servicenterId" INTEGER NOT NULL,
        "servicenterNombre" TEXT NOT NULL,
        "typeFuelId" INTEGER NOT NULL,
        "typeFuelNombre" TEXT NOT NULL,
        "litros" DOUBLE PRECISION NOT NULL,
        "montoUsd" DOUBLE PRECISION NOT NULL,
        "metodoPago" TEXT NOT NULL DEFAULT 'ZELLE',
        "estado" TEXT NOT NULL DEFAULT 'pendiente_pago',
        "cupetExternalId" TEXT,
        "cupetTransactionId" INTEGER,
        "pin" TEXT,
        "expiracionPin" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    YA_CREATADA.ok = true;
  } catch (e) {
    console.error('[solicitudes] No se pudo asegurar la tabla:', e);
    throw e;
  }
}
