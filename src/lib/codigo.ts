// ════════════════════════════════════════════════════════════════════════════
// Generación segura del código de paquete: LXE + 10 dígitos
// (igual que ikomsoft, ej: LXE2502421137).
// ════════════════════════════════════════════════════════════════════════════
import { db } from "./db";

export async function generarCodigoPaquete(): Promise<string> {
  // Contar cuántos códigos existen ya con prefijo LXE y calcular el siguiente.
  const existentes = await db.paquete.findMany({
    where: { codigo: { startsWith: "LXE" } },
    select: { codigo: true },
  });
  let max = 0;
  for (const p of existentes) {
    const n = parseInt(p.codigo.slice(3), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  // Reintentar si por carrera el código ya existe.
  for (let i = 0; i < 5; i++) {
    const codigo = "LXE" + String(max + 1 + i).padStart(10, "0");
    const existe = await db.paquete.findUnique({ where: { codigo } });
    if (!existe) return codigo;
  }
  // Fallback: añadir timestamp.
  return "LXE" + String(max + 1).padStart(10, "0") + Date.now().toString(36);
}
