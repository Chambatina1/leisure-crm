import { db } from '@/lib/db';

// ─────────────────────────────────────────────────────────────────────────────
// Altas puntuales de productos (migraciones de datos de UNA sola vez).
// Cada alta se marca en la tabla Config ("alta_producto_<id>"), así que si
// luego el producto se borra o edita desde el panel, NO se vuelve a crear.
// ─────────────────────────────────────────────────────────────────────────────

interface AltaProducto {
  id: string; // identificador estable de la alta
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  orden: number;
  copiarImagenDe?: string; // nombre de un producto existente para reutilizar su foto
}

const ALTAS: AltaProducto[] = [
  {
    id: 'cilindro_gas_85_sin_vacio',
    nombre: 'CILINDRO DE GAS (sin entregar vacío)',
    descripcion: 'Cilindro de gas lleno. No necesitas entregar un cilindro vacío a cambio.',
    precio: 85,
    categoria: 'combustible',
    orden: 0,
    copiarImagenDe: 'BALA DE GAS',
  },
];

// Cambios puntuales a productos ya creados (también de una sola vez).
interface CambioProducto {
  id: string;
  buscarNombre: string; // producto a modificar (si no existe, se ignora)
  datos: { nombre?: string; descripcion?: string; precio?: number };
}

const CAMBIOS: CambioProducto[] = [
  {
    id: 'cilindro_gas_85_la_lisa',
    buscarNombre: 'CILINDRO DE GAS (sin entregar vacío)',
    datos: {
      nombre: 'CILINDRO DE GAS — Recogida en La Lisa',
      descripcion:
        'Cilindro de gas lleno por $85. Se recoge en nuestro punto de venta en La Lisa. No hace falta entregar balita vacía a cambio.',
      precio: 85,
    },
  },
];

let promesa: Promise<void> | null = null;

async function aplicarAltas(): Promise<void> {
  for (const alta of ALTAS) {
    const clave = `alta_producto_${alta.id}`;
    const hecha = await db.config.findUnique({ where: { clave } });
    if (hecha) continue;

    const yaExiste = await db.tiendaProduct.findFirst({ where: { nombre: alta.nombre } });
    if (!yaExiste) {
      const origen = alta.copiarImagenDe
        ? await db.tiendaProduct.findFirst({
            where: { nombre: alta.copiarImagenDe },
            select: { imagenUrl: true },
          })
        : null;

      await db.tiendaProduct.create({
        data: {
          nombre: alta.nombre,
          descripcion: alta.descripcion,
          precio: alta.precio,
          categoria: alta.categoria,
          orden: alta.orden,
          activo: true,
          imagenUrl: origen?.imagenUrl ?? null,
        },
      });
      console.log(`[Tienda] Producto agregado: ${alta.nombre}`);
    }

    await db.config.create({ data: { clave, valor: new Date().toISOString() } });
  }

  for (const cambio of CAMBIOS) {
    const clave = `cambio_producto_${cambio.id}`;
    const hecho = await db.config.findUnique({ where: { clave } });
    if (hecho) continue;

    const producto = await db.tiendaProduct.findFirst({ where: { nombre: cambio.buscarNombre } });
    if (producto) {
      await db.tiendaProduct.update({ where: { id: producto.id }, data: cambio.datos });
      console.log(`[Tienda] Producto actualizado: ${cambio.datos.nombre ?? producto.nombre}`);
    }
    await db.config.create({ data: { clave, valor: new Date().toISOString() } });
  }
}

export function asegurarProductosNuevos(): Promise<void> {
  if (!promesa) {
    promesa = aplicarAltas().catch((err) => {
      promesa = null; // reintentar en la próxima petición
      console.error('[Tienda] No se pudieron aplicar altas de productos:', err);
    });
  }
  return promesa;
}
