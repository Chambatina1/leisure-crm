import { HORAS_APARTADO } from '@/lib/existencia';
import { db } from '@/lib/db';
import type { PuntoRecogida } from '@/lib/puntos-gas';

// Puntos de recogida de las balitas de gas, editables desde el panel
// (Tienda → Puntos de recogida). Se guardan como JSON en Config.
const CLAVE = 'puntos_recogida';

export const PUNTOS_INICIALES: PuntoRecogida[] = [
  { id: 'bar-madera', nombre: 'Punto de Gas de Madera', lugar: 'Arroyo Arena, La Lisa', activo: true },
  { id: 'barbosa', nombre: 'Punto de venta Barbosa', lugar: 'Municipio Playa', activo: true },
];

export async function leerPuntos(): Promise<PuntoRecogida[]> {
  const fila = await db.config.findUnique({ where: { clave: CLAVE } });
  if (!fila?.valor) return PUNTOS_INICIALES;
  try {
    const lista = JSON.parse(fila.valor);
    return Array.isArray(lista) ? lista : PUNTOS_INICIALES;
  } catch {
    return PUNTOS_INICIALES;
  }
}

export async function guardarPuntos(puntos: PuntoRecogida[]) {
  const valor = JSON.stringify(puntos);
  await db.config.upsert({ where: { clave: CLAVE }, update: { valor }, create: { clave: CLAVE, valor } });
}

/**
 * Suma (delta > 0) o resta (delta < 0) balitas a un punto, en una sola
 * sentencia para que dos pagos o un pago y el panel no se pisen.
 * Con `crear`, un punto sin control empieza a contar desde 0.
 */
export async function ajustarBalitasPunto(puntoId: string, delta: number, crear = false) {
  if (!puntoId || !Number.isInteger(delta) || delta === 0) return;
  await db.$executeRawUnsafe(
    `UPDATE "Config" SET "valor" = (
       SELECT COALESCE(jsonb_agg(
         CASE WHEN e->>'id' = $1::text AND ($3::boolean OR jsonb_typeof(e->'existencia') = 'number')
           THEN jsonb_set(e, '{existencia}', to_jsonb(GREATEST(COALESCE(
             CASE WHEN jsonb_typeof(e->'existencia') = 'number' THEN (e->>'existencia')::numeric::int END, 0) + $2::int, 0)))
           ELSE e END ORDER BY ord), '[]'::jsonb)::text
       FROM jsonb_array_elements("valor"::jsonb) WITH ORDINALITY AS t(e, ord))
     WHERE "clave" = '${CLAVE}'`,
    puntoId,
    delta,
    crear
  );
}

/** Descuenta balitas vendidas del punto donde se recogen (si el punto lleva control). */
export async function descontarBalitasPunto(puntoId: string, cantidad: number) {
  if (!puntoId || !(cantidad > 0)) return;
  await ajustarBalitasPunto(puntoId, -cantidad);
}

/** Balitas apartadas por compras sin pagar de la última hora, por punto. */
async function apartadasPorPunto(): Promise<Map<string, number>> {
  try {
    const filas = await db.$queryRawUnsafe<{ puntoId: string; n: number }[]>(
      `SELECT "puntoId", SUM("cantidad")::int AS n FROM "ReservaCilindro"
       WHERE "estado" = 'pendiente_pago' AND "puntoId" IS NOT NULL
         AND "createdAt" > NOW() - INTERVAL '${HORAS_APARTADO} hours'
       GROUP BY "puntoId"`
    );
    return new Map(filas.map((f) => [f.puntoId, Number(f.n) || 0]));
  } catch {
    return new Map(); // la tabla aún no existe: nada apartado
  }
}

/**
 * Balitas a la venta en la tienda: la suma de lo que queda en los puntos activos.
 * null si algún punto activo no lleva control (entonces manda la existencia del producto).
 */
export async function totalBalitasEnPuntos(): Promise<number | null> {
  const activos = (await leerPuntosDisponibles()).filter((p) => p.activo);
  if (!activos.length || activos.some((p) => typeof p.existencia !== 'number')) return null;
  return activos.reduce((s, p) => s + (p.existencia as number), 0);
}

/** Puntos con las balitas a la venta: la existencia menos lo apartado en la última hora. */
export async function leerPuntosDisponibles(): Promise<PuntoRecogida[]> {
  const [puntos, apartadas] = await Promise.all([leerPuntos(), apartadasPorPunto()]);
  return puntos.map((p) =>
    typeof p.existencia === 'number'
      ? { ...p, existencia: Math.max(0, p.existencia - (apartadas.get(p.id) || 0)) }
      : p
  );
}
