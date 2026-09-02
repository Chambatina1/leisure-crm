import { db } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Auto-restauración del catálogo: si la tabla de productos queda vacía (p. ej.
// un reinicio de servidor con BD recién creada), la tienda se repuebla sola
// desde la semilla src/data/catalogo-seed.json. Así el catálogo nunca
// desaparece para los visitantes.
// ─────────────────────────────────────────────────────────────────────────────

let seedPromise: Promise<void> | null = null;

interface SeedProduct {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  categoria?: string;
  imagenUrl?: string | null;
  activo?: boolean;
  orden?: number;
}

async function seedIfEmpty(): Promise<void> {
  const count = await db.tiendaProduct.count();
  if (count > 0) return;

  try {
    const seedPath = path.join(process.cwd(), 'src', 'data', 'catalogo-seed.json');
    const raw = await fs.readFile(seedPath, 'utf-8');
    const products: SeedProduct[] = JSON.parse(raw);
    if (!Array.isArray(products) || products.length === 0) return;

    // Insertar en lotes para no saturar la conexión
    const BATCH = 20;
    for (let i = 0; i < products.length; i += BATCH) {
      const batch = products.slice(i, i + BATCH).map((p) => ({
        nombre: p.nombre,
        descripcion: p.descripcion || null,
        precio: p.precio,
        categoria: p.categoria || 'general',
        imagenUrl: p.imagenUrl || null,
        activo: p.activo ?? true,
        orden: p.orden ?? 10,
      }));
      await db.tiendaProduct.createMany({ data: batch });
    }
    console.log(`[Catálogo] Auto-restaurado: ${products.length} productos desde la semilla`);
  } catch (error) {
    // Si no hay semilla o falla, no romper la app — solo registrar
    console.error('[Catálogo] No se pudo auto-restaurar:', error);
  }
}

// Singleton: evita carras si varias peticiones llegan a la vez con la BD vacía
export function ensureCatalogo(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seedIfEmpty().catch((err) => {
      seedPromise = null; // permite reintentar en la próxima petición
      throw err;
    });
  }
  return seedPromise;
}
