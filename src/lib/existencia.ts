import { db } from '@/lib/db';

// Existencia (stock) de cada producto de la tienda. Se guarda en una columna
// "existencia" de TiendaProduct que se crea sola al arrancar (el despliegue no
// corre migraciones). NULL = sin control de existencia (se vende sin límite).
let columnaLista = false;

export async function asegurarColumnaExistencia() {
  if (columnaLista) return;
  await db.$executeRawUnsafe(`ALTER TABLE "TiendaProduct" ADD COLUMN IF NOT EXISTS "existencia" INTEGER`);
  columnaLista = true;
}

/** Existencia de los productos indicados (o de todos). */
export async function existencias(ids?: number[]): Promise<Map<number, number | null>> {
  await asegurarColumnaExistencia();
  const filas = ids
    ? await db.$queryRawUnsafe<{ id: number; existencia: number | null }[]>(
        `SELECT "id", "existencia" FROM "TiendaProduct" WHERE "id" = ANY($1::int[])`,
        ids
      )
    : await db.$queryRawUnsafe<{ id: number; existencia: number | null }[]>(
        `SELECT "id", "existencia" FROM "TiendaProduct"`
      );
  return new Map(filas.map((f) => [Number(f.id), f.existencia === null ? null : Number(f.existencia)]));
}

export async function guardarExistencia(id: number, existencia: number | null) {
  await asegurarColumnaExistencia();
  await db.$executeRawUnsafe(`UPDATE "TiendaProduct" SET "existencia" = $1 WHERE "id" = $2`, existencia, id);
}

/** Descuenta lo vendido. Los productos sin control de existencia no cambian. */
export async function descontarExistencia(items: { id: number; qty: number }[]) {
  await asegurarColumnaExistencia();
  for (const { id, qty } of items) {
    await db.$executeRawUnsafe(
      `UPDATE "TiendaProduct" SET "existencia" = GREATEST("existencia" - $1, 0) WHERE "id" = $2 AND "existencia" IS NOT NULL`,
      qty,
      id
    );
  }
}

// Lo vendido viaja en los metadatos de Stripe como "id:cant,id:cant"
export const itemsAMetadata = (items: { id: number; qty: number }[]) => items.map((i) => `${i.id}:${i.qty}`).join(',');
export function itemsDeMetadata(s: string | undefined | null): { id: number; qty: number }[] {
  if (!s) return [];
  return s
    .split(',')
    .map((par) => par.split(':').map(Number))
    .filter(([id, qty]) => id > 0 && qty > 0)
    .map(([id, qty]) => ({ id, qty }));
}

// Una compra sin pagar aparta sus balitas solo 1 hora. Pasada la hora se
// cancela y las balitas vuelven a estar a la venta. La existencia guardada
// solo baja cuando el pago se confirma.
export const HORAS_APARTADO = 1;

/** Balitas apartadas por compras sin pagar de la última hora, por producto. */
async function apartadosPorProducto(): Promise<Map<number, number>> {
  const m = new Map<number, number>();
  try {
    const filas = await db.$queryRawUnsafe<{ items: string | null }[]>(
      `SELECT "items" FROM "ReservaCilindro"
       WHERE "estado" = 'pendiente_pago' AND "items" IS NOT NULL
         AND "createdAt" > NOW() - INTERVAL '${HORAS_APARTADO} hours'`
    );
    for (const f of filas) for (const { id, qty } of itemsDeMetadata(f.items)) m.set(id, (m.get(id) || 0) + qty);
  } catch {
    // la tabla o la columna aún no existen: nada apartado
  }
  return m;
}

/** Existencia a la venta: la guardada (baja al pagarse) menos lo apartado en la última hora. */
export async function existenciasDisponibles(ids?: number[]): Promise<Map<number, number | null>> {
  const [stock, apartados] = await Promise.all([existencias(ids), apartadosPorProducto()]);
  for (const [id, n] of stock) if (n !== null) stock.set(id, Math.max(0, n - (apartados.get(id) || 0)));

  // Balitas de gas: si los puntos de recogida llevan cantidad, la tienda vende la suma de los puntos
  try {
    const { totalBalitasEnPuntos } = await import('@/lib/puntos-recogida');
    const { esBalitaGas } = await import('@/lib/puntos-gas');
    const total = await totalBalitasEnPuntos();
    if (total !== null && stock.size) {
      const filas = await db.$queryRawUnsafe<{ id: number; nombre: string }[]>(
        `SELECT "id", "nombre" FROM "TiendaProduct" WHERE "id" = ANY($1::int[])`,
        [...stock.keys()]
      );
      for (const f of filas) if (esBalitaGas(f.nombre)) stock.set(Number(f.id), total);
    }
  } catch (e) {
    console.error('[existencia] No se pudo leer la existencia de los puntos:', e instanceof Error ? e.message : e);
  }
  return stock;
}
