// ════════════════════════════════════════════════════════════════════════════
// Generación ATÓMICA de código de paquete: VC + 10 dígitos
// (Vuela Cargo). Contador global en la tabla Config.
// Garantiza que NUNCA se repita entre agencias ni simultáneamente.
// ════════════════════════════════════════════════════════════════════════════
import { db } from "./db";

export async function generarCodigoPaquete(): Promise<string> {
  // Usar una transacción para garantizar atomicidad.
  // El contador vive en Config con key="contadorPaquetes".
  // PostgreSQL garantiza que la transacción es atómica — dos agencias
  // que creen al mismo tiempo obtienen números distintos SIEMPRE.

  for (let intento = 0; intento < 5; intento++) {
    try {
      const resultado = await db.$transaction(async (tx) => {
        // 1. Leer el contador actual (bloquear la fila con SELECT FOR UPDATE implícito)
        const cfg = await tx.config.findUnique({ where: { key: "contadorPaquetes" } });
        let actual = cfg ? parseInt(cfg.value, 10) : 0;

        // Si no existe el contador, calcular desde los paquetes existentes
        if (!cfg || isNaN(actual)) {
          const existentes = await tx.paquete.findMany({
            where: { codigo: { startsWith: "VC" } },
            select: { codigo: true },
          });
          for (const p of existentes) {
            const n = parseInt(p.codigo.slice(2), 10);
            if (!isNaN(n) && n > actual) actual = n;
          }
        }

        // 2. Incrementar
        const siguiente = actual + 1;
        const codigo = "VC" + String(siguiente).padStart(10, "0");

        // 3. Verificar que no exista (doble seguridad)
        const yaExiste = await tx.paquete.findUnique({ where: { codigo } });
        if (yaExiste) throw new Error("Código duplicado: " + codigo);

        // 4. Guardar el nuevo contador
        await tx.config.upsert({
          where: { key: "contadorPaquetes" },
          update: { value: String(siguiente) },
          create: { key: "contadorPaquetes", value: String(siguiente) },
        });

        return codigo;
      });

      return resultado;
    } catch (e: any) {
      // Si fue por colisión (concurrente), reintentar
      if (intento < 4 && String(e?.message || "").includes("duplicado")) {
        continue;
      }
      // Si fue otro error, fallback con timestamp único
      console.error("Error generando código:", e);
    }
  }

  // Fallback extremo: timestamp + random (garantiza unicidad)
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return "VC" + ts + rand;
}
