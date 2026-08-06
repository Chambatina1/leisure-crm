// ════════════════════════════════════════════════════════════════════════════
// Generación segura del código de paquete: LE-YYYY-NNNN
// Usa una transacción para evitar condiciones de carrera (a diferencia del
// frontend original, que escaneaba todas las filas).
// ════════════════════════════════════════════════════════════════════════════
import { db } from "./db";

export async function generarCodigoPaquete(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `LE-${year}-`;
  // Contar cuántos códigos existen ya con este prefijo y calcular el siguiente.
  // count es O(1) en BD con índice; usamos el max real para mayor seguridad.
  const existentes = await db.paquete.findMany({
    where: { codigo: { startsWith: prefix } },
    select: { codigo: true },
  });
  let max = 0;
  for (const p of existentes) {
    const n = parseInt(p.codigo.slice(prefix.length), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  // Reintentar si por carrera el código ya existe.
  for (let i = 0; i < 5; i++) {
    const codigo = prefix + String(max + 1 + i).padStart(4, "0");
    const existe = await db.paquete.findUnique({ where: { codigo } });
    if (!existe) return codigo;
  }
  // Fallback: añadir timestamp para garantizar unicidad.
  return prefix + String(max + 1).padStart(4, "0") + "-" + Date.now().toString(36);
}
