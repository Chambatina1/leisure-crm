// ============================================================
// Reservas de cilindros de gas (recogida en Los Avioncitos o Bar Madera)
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
export const ZELLE_CILINDROS = process.env.ZELLE_CILINDROS || '727-598-6802';

// Puntos de recogida. El cliente elige uno al reservar; las reservas
// antiguas (sin punto guardado) son de Los Avioncitos.
export const PUNTOS_RECOGIDA = {
  avioncitos: {
    nombre: 'Los Avioncitos',
    direccion: '"LOS AVIONCITOS" — Calle 210 / calle 31 y 33, Alturas de la Coronela, municipio La Lisa, La Habana',
  },
  'bar-madera': {
    nombre: 'Bar Madera',
    direccion: 'Punto de gas "BAR MADERA" — Arroyo Arenas, municipio La Lisa, La Habana',
  },
} as const;
export type PuntoRecogida = keyof typeof PUNTOS_RECOGIDA;
export const PUNTO_POR_DEFECTO: PuntoRecogida = 'avioncitos';

export function esPunto(p: unknown): p is PuntoRecogida {
  return typeof p === 'string' && p in PUNTOS_RECOGIDA;
}

/** Dirección completa del punto de una reserva. */
export function puntoDe(p: string | null | undefined) {
  return PUNTOS_RECOGIDA[esPunto(p) ? p : PUNTO_POR_DEFECTO];
}

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
  punto: PuntoRecogida;
  pagadaEn: Date | null;
  entregadaEn: Date | null;
  notas: string | null;
  createdAt: Date;
}

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
  await db.$executeRawUnsafe(
    `ALTER TABLE "ReservaCilindro" ADD COLUMN IF NOT EXISTS "punto" TEXT NOT NULL DEFAULT '${PUNTO_POR_DEFECTO}'`
  );
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
    } ORDER BY "punto" ASC, "nombreRecoge" ASC, "id" ASC`,
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

/** HTML del informe diario de recogida (para correo e impresión), una tabla por punto. */
export function informeHtml(lote: string, reservas: Reserva[]): string {
  const confirmadas = reservas.filter((r) => r.estado === 'pagada' || r.estado === 'entregada');
  const totalCil = confirmadas.reduce((s, r) => s + r.cantidad, 0);
  const totalUsd = confirmadas.reduce((s, r) => s + r.montoUsd, 0);
  const fila = (r: Reserva, i: number) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${i + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb"><b>${esc(r.nombreRecoge)}</b></td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-family:monospace">${esc(r.carnetRecoge)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${r.cantidad}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-family:monospace">${esc(r.numero)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${esc(r.telefonoRecoge || '')}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${esc(r.nombreComprador)}<br><span style="color:#6b7280">${esc(r.telefonoComprador)}</span></td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">$${r.montoUsd.toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${r.estado === 'entregada' ? 'Entregado' : ''}</td>
      </tr>`;

  const secciones = (Object.keys(PUNTOS_RECOGIDA) as PuntoRecogida[])
    .map((p) => {
      const delPunto = confirmadas.filter((r) => puntoDe(r.punto) === PUNTOS_RECOGIDA[p]);
      if (!delPunto.length) return '';
      const cil = delPunto.reduce((s, r) => s + r.cantidad, 0);
      return `
    <h3 style="color:#071a46;margin:24px 0 4px">${esc(PUNTOS_RECOGIDA[p].nombre)} · ${delPunto.length} reservas · ${cil} cilindros</h3>
    <p style="margin:0 0 8px;color:#4b5563">${esc(PUNTOS_RECOGIDA[p].direccion)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead><tr style="background:#071a46;color:#fff;text-align:left">
          <th style="padding:8px">#</th><th style="padding:8px">Recoge</th><th style="padding:8px">Carnet</th>
          <th style="padding:8px">Cant.</th><th style="padding:8px">Reserva</th><th style="padding:8px">Tel. recoge</th><th style="padding:8px">Comprador</th><th style="padding:8px">Pagó</th><th style="padding:8px">Firma / entregado</th>
        </tr></thead><tbody>${delPunto.map(fila).join('')}</tbody></table>`;
    })
    .join('');

  return `
  <div style="font-family:Arial,sans-serif;max-width:980px;margin:0 auto;color:#111827">
    <h2 style="color:#071a46;margin:0">Listado de recogida de cilindros</h2>
    <p style="margin:4px 0 16px;color:#4b5563">Ventas cerradas a las 8:00 PM del ${esc(fechaLarga(lote))}.</p>
    <p style="margin:0 0 12px"><b>${confirmadas.length}</b> reservas confirmadas · <b>${totalCil}</b> cilindros · <b>$${totalUsd.toFixed(2)}</b> USD</p>
    ${confirmadas.length ? secciones : '<p>No hubo reservas confirmadas en este cierre.</p>'}
    <p style="margin-top:16px;color:#6b7280;font-size:12px">El cliente debe presentar su carnet de identidad y decir su PIN de recogida. El PIN se comprueba en el panel (Cilindros → Entregar).</p>
  </div>`;
}
