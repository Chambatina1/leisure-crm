// ============================================================
// Reservas de cilindros de gas (recogida en el punto de gas que elige el cliente)
// ------------------------------------------------------------
// - Las ventas cierran todos los días a las 8:00 PM hora de Cuba.
//   Una reserva hecha antes de las 8 PM entra en el listado de ese día;
//   una hecha después, en el del día siguiente.
// - Al confirmar el pago se genera un PIN de 6 dígitos para el cliente.
// - Al recoger, el empleado comprueba el PIN y marca la reserva entregada.
// - La tabla se crea sola (sin migraciones), como las de CUPET.
// ============================================================
import { randomInt } from 'crypto';
import { db } from '@/lib/db';

export const ZONA_CUBA = 'America/Havana';
export const HORA_CIERRE = 20; // 8:00 PM
export const PRECIO_CILINDRO = 85;
export const MAX_POR_RESERVA = 4;
// Cuenta de Zelle donde pagan los clientes (combustible y cilindros)
export const ZELLE_DESTINO = process.env.ZELLE_DESTINO || 'salesleisureexportingllc@gmail.com';
export const ZELLE_CILINDROS = process.env.ZELLE_CILINDROS || ZELLE_DESTINO;
// Reservas antiguas, hechas antes de que el cliente eligiera punto
export const PUNTO_SIN_ELEGIR = 'Punto de gas por confirmar (Madera, Arroyo Arena, o Barbosa, Playa)';

export type EstadoReserva = 'pendiente_pago' | 'pagada' | 'entregada' | 'anulada';

export interface Reserva {
  id: number;
  numero: string;
  nombreComprador: string;
  telefonoComprador: string;
  emailComprador: string | null;
  nombreRecoge: string;
  carnetRecoge: string;
  telefonoRecoge: string | null;
  cantidad: number;
  montoUsd: number;
  estado: EstadoReserva;
  pin: string | null;
  lote: string; // YYYY-MM-DD: día del listado de recogida
  pagadaEn: Date | null;
  entregadaEn: Date | null;
  notas: string | null;
  puntoId: string | null; // id del punto de recogida elegido (ver puntos-recogida.ts)
  puntoRecogida: string | null; // texto del punto, tal como lo vio el cliente
  createdAt: Date;
}

/** Dónde se recoge esta reserva. */
export const lugarDe = (r: Pick<Reserva, 'puntoRecogida'>) => r.puntoRecogida || PUNTO_SIN_ELEGIR;

let tablaLista = false;

export async function asegurarTablaReservas() {
  if (tablaLista) return;
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ReservaCilindro" (
      "id" SERIAL PRIMARY KEY,
      "numero" TEXT NOT NULL UNIQUE,
      "nombreComprador" TEXT NOT NULL,
      "telefonoComprador" TEXT NOT NULL,
      "emailComprador" TEXT,
      "nombreRecoge" TEXT NOT NULL,
      "carnetRecoge" TEXT NOT NULL,
      "telefonoRecoge" TEXT,
      "cantidad" INTEGER NOT NULL DEFAULT 1,
      "montoUsd" DOUBLE PRECISION NOT NULL,
      "estado" TEXT NOT NULL DEFAULT 'pendiente_pago',
      "pin" TEXT,
      "lote" TEXT NOT NULL,
      "pagadaEn" TIMESTAMP(3),
      "entregadaEn" TIMESTAMP(3),
      "notas" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ReservaCilindro_lote_idx" ON "ReservaCilindro" ("lote")`);
  await db.$executeRawUnsafe(`ALTER TABLE "ReservaCilindro" ADD COLUMN IF NOT EXISTS "puntoId" TEXT`);
  await db.$executeRawUnsafe(`ALTER TABLE "ReservaCilindro" ADD COLUMN IF NOT EXISTS "puntoRecogida" TEXT`);
  tablaLista = true;
}

/** Fecha y hora actuales en Cuba. */
export function ahoraEnCuba(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_CUBA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fecha);
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? '';
  return { dia: `${v('year')}-${v('month')}-${v('day')}`, hora: parseInt(v('hour'), 10) };
}

function sumarDia(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Lote (día de listado) al que va una reserva hecha ahora. */
export function loteActual(fecha = new Date()): string {
  const { dia, hora } = ahoraEnCuba(fecha);
  return hora >= HORA_CIERRE ? sumarDia(dia) : dia;
}

export function nuevoPin(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export async function siguienteNumero(): Promise<string> {
  const filas = await db.$queryRawUnsafe<{ numero: string }[]>(
    `SELECT "numero" FROM "ReservaCilindro" ORDER BY "id" DESC LIMIT 1`
  );
  const n = filas[0] ? parseInt(filas[0].numero.replace('RC-', ''), 10) || 0 : 0;
  return 'RC-' + String(n + 1).padStart(6, '0');
}

export async function reservasDelLote(lote: string, soloPagadas = false): Promise<Reserva[]> {
  await asegurarTablaReservas();
  return db.$queryRawUnsafe<Reserva[]>(
    `SELECT * FROM "ReservaCilindro" WHERE "lote" = $1 ${
      soloPagadas ? `AND "estado" IN ('pagada','entregada')` : ''
    } ORDER BY "puntoRecogida" ASC NULLS LAST, "nombreRecoge" ASC, "id" ASC`,
    lote
  );
}

export const esc = (t: unknown) =>
  String(t ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function fechaLarga(dia: string): string {
  return new Date(`${dia}T12:00:00Z`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Día desde el que se recoge lo pagado en ese lote: siempre el día siguiente. */
export function diaRecogida(lote: string): string {
  const d = new Date(`${lote}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Pedidos de la tienda hechos ese día (hora de Cuba), sin los cancelados. */
export async function pedidosDelDia(dia: string): Promise<PedidoDia[]> {
  return db.$queryRawUnsafe<PedidoDia[]>(
    `SELECT "id","nombreComprador","telefonoComprador","producto","estado" FROM "Pedido"
     WHERE ("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE '${ZONA_CUBA}')::date = $1::date AND "estado" <> 'cancelado'
     ORDER BY "id"`,
    dia
  );
}

/** Venta de la tienda (pedido) del día, para el resumen de las 8 PM. */
export interface PedidoDia {
  id: number;
  nombreComprador: string;
  telefonoComprador: string;
  producto: string;
  estado: string;
}

const td = 'padding:8px;border-bottom:1px solid #e5e7eb';
const th = 'padding:8px';

/** HTML del informe diario (correo de las 8 PM e impresión): una lista por punto de recogida. */
export function informeHtml(lote: string, reservas: Reserva[], pedidos: PedidoDia[] = []): string {
  const confirmadas = reservas.filter((r) => r.estado === 'pagada' || r.estado === 'entregada');
  const totalCil = confirmadas.reduce((s, r) => s + r.cantidad, 0);
  const totalUsd = confirmadas.reduce((s, r) => s + r.montoUsd, 0);

  const grupos = new Map<string, Reserva[]>();
  for (const r of confirmadas) grupos.set(lugarDe(r), [...(grupos.get(lugarDe(r)) || []), r]);

  const tablaPunto = ([punto, lista]: [string, Reserva[]]) => {
    const n = lista.reduce((s, r) => s + r.cantidad, 0);
    const filas = lista
      .map(
        (r, i) => `<tr>
        <td style="${td}">${i + 1}</td>
        <td style="${td}"><b>${esc(r.nombreRecoge)}</b></td>
        <td style="${td};font-family:monospace">${esc(r.carnetRecoge)}</td>
        <td style="${td};font-family:monospace;font-size:16px"><b>${esc(r.pin || '')}</b></td>
        <td style="${td};text-align:center">${r.cantidad}</td>
        <td style="${td};font-family:monospace">${esc(r.numero)}</td>
        <td style="${td}">${esc(r.telefonoRecoge || r.telefonoComprador)}</td>
        <td style="${td}">${r.estado === 'entregada' ? 'Entregado' : ''}</td>
      </tr>`
      )
      .join('');
    return `
    <h3 style="color:#071a46;margin:24px 0 6px">${esc(punto)} · ${n} balita(s)</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#071a46;color:#fff;text-align:left">
        <th style="${th}">#</th><th style="${th}">Nombre y apellidos</th><th style="${th}">Carnet</th><th style="${th}">PIN</th>
        <th style="${th}">Cant.</th><th style="${th}">Compra</th><th style="${th}">Teléfono</th><th style="${th}">Firma / entregado</th>
      </tr></thead><tbody>${filas}</tbody></table>`;
  };

  const ventasTienda = pedidos.length
    ? `<h3 style="color:#071a46;margin:28px 0 6px">Otras ventas de la tienda del día</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#374151;color:#fff;text-align:left">
        <th style="${th}">Pedido</th><th style="${th}">Cliente</th><th style="${th}">Productos</th><th style="${th}">Estado</th>
      </tr></thead><tbody>${pedidos
        .map(
          (p) => `<tr><td style="${td}">${p.id}</td><td style="${td}">${esc(p.nombreComprador)}<br><span style="color:#6b7280">${esc(p.telefonoComprador)}</span></td>
          <td style="${td}">${esc(p.producto)}</td><td style="${td}">${p.estado === 'pagado' ? 'Pagado' : p.estado === 'pendiente_pago' ? 'Esperando pago' : esc(p.estado)}</td></tr>`
        )
        .join('')}</tbody></table>`
    : '';

  return `
  <div style="font-family:Arial,sans-serif;max-width:980px;margin:0 auto;color:#111827">
    <h2 style="color:#071a46;margin:0">Resumen de ventas y listado de recogida</h2>
    <p style="margin:4px 0 12px;color:#4b5563">Ventas cerradas a las 8:00 PM del ${esc(fechaLarga(lote))}. Se entregan a partir de mañana.</p>
    <p style="margin:0 0 12px"><b>${confirmadas.length}</b> compras de balitas pagadas · <b>${totalCil}</b> balitas · <b>$${totalUsd.toFixed(2)}</b> USD</p>
    ${confirmadas.length ? [...grupos].map(tablaPunto).join('') : '<p>No hubo compras de balitas pagadas en este cierre.</p>'}
    ${ventasTienda}
    <p style="margin-top:16px;color:#6b7280;font-size:12px">Para entregar: el cliente presenta el carnet de identidad y dice su PIN. Se marca en el panel (Cilindros → Entregar).</p>
  </div>`;
}
