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
