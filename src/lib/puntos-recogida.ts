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
