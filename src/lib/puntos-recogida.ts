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

/** Descuenta balitas vendidas del punto donde se recogen (si el punto lleva control). */
export async function descontarBalitasPunto(puntoId: string, cantidad: number) {
  if (!puntoId || !(cantidad > 0)) return;
  const puntos = await leerPuntos();
  const p = puntos.find((x) => x.id === puntoId);
  if (!p || typeof p.existencia !== 'number') return;
  p.existencia = Math.max(0, p.existencia - cantidad);
  await guardarPuntos(puntos);
}

// Una compra de balitas pendiente de pago aparta su stock durante este tiempo,
// para que el siguiente cliente vea enseguida las que quedan (20 → 18).
// Si no se paga en ese plazo, las balitas vuelven a estar disponibles.
export const HORAS_APARTADO = 24;

/** Balitas apartadas por compras pendientes de pago recientes, por punto. */
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
 * Puntos con las balitas que de verdad quedan para vender: la existencia
 * (que baja al pagarse) menos lo apartado por compras pendientes de pago.
 */
export async function leerPuntosDisponibles(): Promise<PuntoRecogida[]> {
  const [puntos, apartadas] = await Promise.all([leerPuntos(), apartadasPorPunto()]);
  return puntos.map((p) =>
    typeof p.existencia === 'number'
      ? { ...p, existencia: Math.max(0, p.existencia - (apartadas.get(p.id) || 0)) }
      : p
  );
}
