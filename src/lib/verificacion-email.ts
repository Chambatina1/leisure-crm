// ============================================================
// Verificación de correo por código de 6 dígitos (registro)
// ------------------------------------------------------------
// - El código se guarda HASHEADO (HMAC) y caduca a los 10 minutos.
// - Máximo 5 intentos por código; después hay que pedir otro.
// - 60 s de espera entre envíos al mismo correo y máximo 5 envíos por hora.
// - La tabla se crea sola (sin migraciones), como la de CUPET.
// ============================================================
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { db } from '@/lib/db';

const MINUTOS_VALIDEZ = 10;
const MAX_INTENTOS = 5;
const ESPERA_REENVIO_S = 60;
const MAX_ENVIOS_HORA = 5;

let tablaLista = false;

async function asegurarTabla() {
  if (tablaLista) return;
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VerificacionEmail" (
      "email" TEXT PRIMARY KEY,
      "codigoHash" TEXT NOT NULL,
      "expira" TIMESTAMP(3) NOT NULL,
      "intentos" INTEGER NOT NULL DEFAULT 0,
      "enviadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "enviosHora" INTEGER NOT NULL DEFAULT 1,
      "ventanaDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  tablaLista = true;
}

function hashCodigo(email: string, codigo: string): string {
  const secreto = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'ambitosmax-verificacion';
  return createHmac('sha256', secreto).update(`${email}:${codigo}`).digest('hex');
}

type Fila = {
  email: string;
  codigoHash: string;
  expira: Date;
  intentos: number;
  enviadoEn: Date;
  enviosHora: number;
  ventanaDesde: Date;
};

async function leer(email: string): Promise<Fila | null> {
  const filas = await db.$queryRawUnsafe<Fila[]>(
    `SELECT * FROM "VerificacionEmail" WHERE "email" = $1`,
    email
  );
  return filas[0] ?? null;
}

export type ResultadoCodigo =
  | { ok: true; codigo: string }
  | { ok: false; error: string; esperaSegundos?: number };

/** Crea (o renueva) un código para el email, respetando límites de envío. */
export async function crearCodigo(email: string): Promise<ResultadoCodigo> {
  await asegurarTabla();
  const ahora = Date.now();
  const fila = await leer(email);

  let enviosHora = 1;
  let ventanaDesde = new Date(ahora);

  if (fila) {
    const desdeUltimo = (ahora - new Date(fila.enviadoEn).getTime()) / 1000;
    if (desdeUltimo < ESPERA_REENVIO_S) {
      const espera = Math.ceil(ESPERA_REENVIO_S - desdeUltimo);
      return { ok: false, error: `Espera ${espera} s para pedir otro código`, esperaSegundos: espera };
    }
    const enVentana = ahora - new Date(fila.ventanaDesde).getTime() < 3600 * 1000;
    if (enVentana) {
      if (fila.enviosHora >= MAX_ENVIOS_HORA) {
        return { ok: false, error: 'Demasiados códigos pedidos. Inténtalo dentro de una hora.' };
      }
      enviosHora = fila.enviosHora + 1;
      ventanaDesde = new Date(fila.ventanaDesde);
    }
  }

  const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const expira = new Date(ahora + MINUTOS_VALIDEZ * 60 * 1000);

  await db.$executeRawUnsafe(
    `INSERT INTO "VerificacionEmail" ("email","codigoHash","expira","intentos","enviadoEn","enviosHora","ventanaDesde")
     VALUES ($1,$2,$3,0,$4,$5,$6)
     ON CONFLICT ("email") DO UPDATE SET
       "codigoHash" = EXCLUDED."codigoHash", "expira" = EXCLUDED."expira", "intentos" = 0,
       "enviadoEn" = EXCLUDED."enviadoEn", "enviosHora" = EXCLUDED."enviosHora",
       "ventanaDesde" = EXCLUDED."ventanaDesde"`,
    email,
    hashCodigo(email, codigo),
    expira,
    new Date(ahora),
    enviosHora,
    ventanaDesde
  );

  return { ok: true, codigo };
}

/** Comprueba el código. Si es correcto lo consume (no se puede reutilizar). */
export async function verificarCodigo(
  email: string,
  codigo: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await asegurarTabla();
  if (!/^\d{6}$/.test(codigo)) return { ok: false, error: 'El código debe tener 6 dígitos' };

  const fila = await leer(email);
  if (!fila) return { ok: false, error: 'Pide un código de verificación primero' };
  if (new Date(fila.expira).getTime() < Date.now()) {
    return { ok: false, error: 'El código caducó. Pide uno nuevo.' };
  }
  if (fila.intentos >= MAX_INTENTOS) {
    return { ok: false, error: 'Demasiados intentos. Pide un código nuevo.' };
  }

  const esperado = Buffer.from(fila.codigoHash, 'hex');
  const recibido = Buffer.from(hashCodigo(email, codigo), 'hex');
  const correcto = esperado.length === recibido.length && timingSafeEqual(esperado, recibido);

  if (!correcto) {
    await db.$executeRawUnsafe(
      `UPDATE "VerificacionEmail" SET "intentos" = "intentos" + 1 WHERE "email" = $1`,
      email
    );
    const quedan = MAX_INTENTOS - fila.intentos - 1;
    return {
      ok: false,
      error: quedan > 0 ? `Código incorrecto. Te quedan ${quedan} intentos.` : 'Código incorrecto. Pide uno nuevo.',
    };
  }

  await db.$executeRawUnsafe(`DELETE FROM "VerificacionEmail" WHERE "email" = $1`, email);
  return { ok: true };
}

// ---- Límite por IP (en memoria) para frenar bots ----
const porIp = new Map<string, { n: number; hasta: number }>();

export function limiteIp(ip: string, max: number, ventanaMs: number): boolean {
  const ahora = Date.now();
  const r = porIp.get(ip);
  if (!r || r.hasta < ahora) {
    porIp.set(ip, { n: 1, hasta: ahora + ventanaMs });
    return true;
  }
  r.n += 1;
  return r.n <= max;
}

// Dominios de correo desechable más comunes
const DESECHABLES = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org',
  'yopmail.com', 'trashmail.com', 'getnada.com', 'sharklasers.com', 'dispostable.com',
  'maildrop.cc', 'fakeinbox.com', 'throwawaymail.com', 'moakt.com', 'emailondeck.com',
]);

export function esCorreoDesechable(email: string): boolean {
  const dominio = email.split('@')[1]?.toLowerCase() || '';
  return DESECHABLES.has(dominio);
}
