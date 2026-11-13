import { randomInt } from 'crypto';
import { db } from '@/lib/db';
import { enviarCorreo } from '@/lib/mailer';
import { ZELLE_DESTINO, esc } from '@/lib/cilindros';

// ═══════════════════════════════════════════════════════════════
// Billetera virtual del cliente (saldo de compras, circuito cerrado).
//  - Cada cliente registrado tiene UN código fijo BM-12345.
//  - Recarga: Zelle a salesleisureexportingllc@gmail.com con BM-12345 en la
//    nota. El aviso del banco (scripts/zelle-gmail.gs → /api/zelle/aviso)
//    suma el saldo.
//  - El saldo SOLO sirve para comprar en ambitosmax.com: no se transfiere a
//    otra persona ni se saca en efectivo. Lo no usado se devuelve por Zelle
//    a petición del cliente (lo hace ventas desde el panel).
//  - El saldo nunca se guarda como un número suelto: es la suma de los
//    movimientos, que no se borran ni se editan.
// ═══════════════════════════════════════════════════════════════

/** Saldo máximo que puede tener una billetera (USD). Se puede cambiar con BILLETERA_TOPE. */
export function topeSaldo(): number {
  const n = Number(process.env.BILLETERA_TOPE);
  return Number.isFinite(n) && n > 0 ? n : 1000;
}

export type TipoMovimiento = 'recarga' | 'compra' | 'devolucion' | 'ajuste';

export interface Billetera {
  id: number;
  userId: number;
  codigo: string;
  createdAt: string;
}

export interface Movimiento {
  id: number;
  billeteraId: number;
  tipo: TipoMovimiento;
  centavos: number;
  referencia: string | null;
  detalle: string | null;
  creadoPor: string;
  createdAt: string;
}

export const aCentavos = (usd: number) => Math.round(usd * 100);
export const usd = (centavos: number) => `$${(centavos / 100).toFixed(2)}`;

let tablasListas = false;
export async function asegurarTablasBilletera() {
  if (tablasListas) return;
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Billetera" (
      "id" SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL UNIQUE,
      "codigo" TEXT NOT NULL UNIQUE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "MovimientoBilletera" (
      "id" SERIAL PRIMARY KEY,
      "billeteraId" INTEGER NOT NULL REFERENCES "Billetera"("id"),
      "tipo" TEXT NOT NULL,
      "centavos" INTEGER NOT NULL,
      "referencia" TEXT,
      "detalle" TEXT,
      "creadoPor" TEXT NOT NULL DEFAULT 'sistema',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
  // Un mismo aviso de Zelle o una misma compra no se pueden aplicar dos veces
  await db.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "MovimientoBilletera_tipo_ref" ON "MovimientoBilletera" ("tipo", "referencia")`
  );
  await db.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "MovimientoBilletera_billetera" ON "MovimientoBilletera" ("billeteraId", "createdAt")`
  );
  tablasListas = true;
}

/** Normaliza lo que escribe el cliente ("bm 12345", "BM-12345") a BM-12345. */
export function normalizarCodigo(texto: string): string | null {
  const m = texto.match(/\bBM\s*[-–]?\s*(\d{5})\b/i);
  return m ? `BM-${m[1]}` : null;
}

/** La billetera del cliente; se crea con su código la primera vez. */
export async function billeteraDeUsuario(userId: number): Promise<Billetera> {
  await asegurarTablasBilletera();
  const previa = await db.$queryRawUnsafe<Billetera[]>(`SELECT * FROM "Billetera" WHERE "userId" = $1`, userId);
  if (previa[0]) return previa[0];
  for (let intento = 0; intento < 8; intento++) {
    const codigo = `BM-${randomInt(10000, 100000)}`;
    const nueva = await db.$queryRawUnsafe<Billetera[]>(
      `INSERT INTO "Billetera" ("userId", "codigo") VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
      userId,
      codigo
    );
    if (nueva[0]) return nueva[0];
    // Conflicto: o el código ya existe (se prueba otro) o se creó a la vez para este usuario
    const ya = await db.$queryRawUnsafe<Billetera[]>(`SELECT * FROM "Billetera" WHERE "userId" = $1`, userId);
    if (ya[0]) return ya[0];
  }
  throw new Error('No se pudo crear el código de billetera');
}

export async function billeteraPorCodigo(codigo: string): Promise<Billetera | null> {
  await asegurarTablasBilletera();
  const f = await db.$queryRawUnsafe<Billetera[]>(`SELECT * FROM "Billetera" WHERE "codigo" = $1`, codigo);
  return f[0] ?? null;
}

export async function saldoCentavos(billeteraId: number): Promise<number> {
  await asegurarTablasBilletera();
  const f = await db.$queryRawUnsafe<{ s: bigint | number | null }[]>(
    `SELECT COALESCE(SUM("centavos"), 0) AS s FROM "MovimientoBilletera" WHERE "billeteraId" = $1`,
    billeteraId
  );
  return Number(f[0]?.s ?? 0);
}

export async function movimientos(billeteraId: number, limite = 50): Promise<Movimiento[]> {
  await asegurarTablasBilletera();
  return db.$queryRawUnsafe<Movimiento[]>(
    `SELECT * FROM "MovimientoBilletera" WHERE "billeteraId" = $1 ORDER BY "createdAt" DESC, "id" DESC LIMIT ${Math.min(Math.max(limite, 1), 500)}`,
    billeteraId
  );
}

export type ResultadoMovimiento =
  | { ok: true; movimiento: Movimiento; saldo: number }
  | { ok: false; motivo: 'saldo_insuficiente' | 'tope' | 'duplicado'; saldo: number };

/**
 * Anota un movimiento de forma atómica: bloquea la billetera, calcula el saldo
 * y solo inserta si el saldo no queda negativo ni pasa del tope (las recargas).
 * centavos > 0 entra dinero, < 0 sale.
 */
export async function anotarMovimiento(m: {
  billeteraId: number;
  tipo: TipoMovimiento;
  centavos: number;
  referencia?: string | null;
  detalle?: string | null;
  creadoPor?: string;
  respetarTope?: boolean;
}): Promise<ResultadoMovimiento> {
  if (!Number.isInteger(m.centavos) || m.centavos === 0) throw new Error('Importe no válido');
  await asegurarTablasBilletera();
  return db.$transaction(async (tx) => {
    await tx.$queryRawUnsafe(`SELECT "id" FROM "Billetera" WHERE "id" = $1 FOR UPDATE`, m.billeteraId);
    const f = await tx.$queryRawUnsafe<{ s: bigint | number | null }[]>(
      `SELECT COALESCE(SUM("centavos"), 0) AS s FROM "MovimientoBilletera" WHERE "billeteraId" = $1`,
      m.billeteraId
    );
    const saldo = Number(f[0]?.s ?? 0);
    if (m.referencia) {
      const dup = await tx.$queryRawUnsafe<{ id: number }[]>(
        `SELECT "id" FROM "MovimientoBilletera" WHERE "tipo" = $1 AND "referencia" = $2`,
        m.tipo,
        m.referencia
      );
      if (dup[0]) return { ok: false as const, motivo: 'duplicado' as const, saldo };
    }
    const nuevo = saldo + m.centavos;
    if (nuevo < 0) return { ok: false as const, motivo: 'saldo_insuficiente' as const, saldo };
    if (m.respetarTope && m.centavos > 0 && nuevo > aCentavos(topeSaldo())) {
      return { ok: false as const, motivo: 'tope' as const, saldo };
    }
    const ins = await tx.$queryRawUnsafe<Movimiento[]>(
      `INSERT INTO "MovimientoBilletera" ("billeteraId","tipo","centavos","referencia","detalle","creadoPor")
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      m.billeteraId,
      m.tipo,
      m.centavos,
      m.referencia ?? null,
      m.detalle ? m.detalle.slice(0, 500) : null,
      m.creadoPor ?? 'sistema'
    );
    return { ok: true as const, movimiento: ins[0], saldo: nuevo };
  });
}

/** Cobra una compra del saldo. Falla (sin tocar nada) si no alcanza. */
export function cobrarCompra(billeteraId: number, centavos: number, referencia: string, detalle: string) {
  return anotarMovimiento({ billeteraId, tipo: 'compra', centavos: -Math.abs(centavos), referencia, detalle });
}

/** Devuelve al saldo lo cobrado por una compra que no se pudo completar. */
export function reintegrarCompra(billeteraId: number, centavos: number, referencia: string, detalle: string) {
  return anotarMovimiento({ billeteraId, tipo: 'ajuste', centavos: Math.abs(centavos), referencia: `reintegro ${referencia}`, detalle });
}

/** Datos del dueño de la billetera, para escribirle. */
export async function duenoBilletera(billeteraId: number): Promise<{ nombre: string; email: string; codigo: string } | null> {
  await asegurarTablasBilletera();
  const f = await db.$queryRawUnsafe<{ nombre: string; email: string; codigo: string }[]>(
    `SELECT u."nombre", u."email", b."codigo" FROM "Billetera" b JOIN "User" u ON u."id" = b."userId" WHERE b."id" = $1`,
    billeteraId
  );
  return f[0] ?? null;
}

/** Correo al cliente cuando entra o sale dinero de su billetera (no en compras: esas tienen su propio correo). */
export async function avisarMovimiento(billeteraId: number, tipo: 'recarga' | 'devolucion' | 'ajuste', centavos: number, saldo: number) {
  const d = await duenoBilletera(billeteraId);
  if (!d?.email) return;
  const titulo =
    tipo === 'recarga' ? `Recargaste ${usd(centavos)} en tu billetera` :
    tipo === 'devolucion' ? `Te devolvimos ${usd(Math.abs(centavos))} de tu billetera` :
    `Ajuste de ${usd(centavos)} en tu billetera`;
  const extra = tipo === 'devolucion' ? 'La devolución se hizo por Zelle a tu cuenta.' : 'Ya puedes usar tu saldo para comprar en ambitosmax.com.';
  await enviarCorreo({
    to: d.email,
    replyTo: ZELLE_DESTINO,
    subject: `${titulo} — saldo ${usd(saldo)} (${d.codigo})`,
    text: `Hola ${d.nombre}. ${titulo}. Tu saldo ahora es ${usd(saldo)}. Billetera ${d.codigo}. ${extra}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111827">
      <h2 style="color:#071a46">${esc(titulo)}</h2>
      <p>Hola ${esc(d.nombre)},</p>
      <p style="font-size:28px;font-weight:800;background:#071a46;color:#7ed957;text-align:center;padding:16px;border-radius:12px">Saldo: ${usd(saldo)}</p>
      <p>Billetera <b>${esc(d.codigo)}</b>. ${esc(extra)}</p>
      <p style="color:#6b7280;font-size:12px">El saldo solo sirve para comprar en ambitosmax.com. No se transfiere a otras personas ni se cambia por efectivo. Si quieres que te devolvamos el saldo que no hayas usado, responde a este correo.</p>
    </div>`,
  }).catch((e) => console.error('[billetera] No se pudo avisar al cliente:', e instanceof Error ? e.message : e));
}
