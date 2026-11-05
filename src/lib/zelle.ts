import { timingSafeEqual } from 'crypto';
import { db } from '@/lib/db';
import { asegurarTablaSolicitudes } from '@/lib/asegurar-tabla-cupet';
import { asegurarTablaReservas, type Reserva } from '@/lib/cilindros';
import { confirmarSolicitudCombustible, enviarPinCombustible } from '@/lib/pin-combustible';
import { confirmarReservaCilindro } from '@/lib/confirmar-reserva';

// ═══════════════════════════════════════════════════════════════
// Pagos por Zelle automáticos.
// Un script de Google (scripts/zelle-gmail.gs) revisa el Gmail donde llegan
// los avisos del banco y manda cada aviso a /api/zelle/aviso. Aquí se lee el
// monto y la referencia RC-000123 (reserva de balitas de gas); si coincide con
// una reserva pendiente se confirma el pago y se envía el PIN. Los pagos de
// combustible (SC-) quedan para confirmar a mano salvo ZELLE_AUTO_COMBUSTIBLE=1.
// Lo que no cuadra queda para revisar a mano (el script lo etiqueta en Gmail).
// ═══════════════════════════════════════════════════════════════

// Dominios de bancos cuyos avisos se aceptan. Se puede cambiar con ZELLE_BANCOS
// (separados por coma) en Render.
const BANCOS_POR_DEFECTO = [
  'chase.com',
  'bankofamerica.com',
  'wellsfargo.com',
  'citi.com',
  'capitalone.com',
  'td.com',
  'tdbank.com',
  'pnc.com',
  'usbank.com',
  'truist.com',
  'regions.com',
  'navyfederal.org',
  'zellepay.com',
];

export function bancosPermitidos(): string[] {
  const env = (process.env.ZELLE_BANCOS || '').split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
  return env.length ? env : BANCOS_POR_DEFECTO;
}

const esDeBanco = (dominio: string, bancos: string[]) =>
  bancos.some((b) => dominio === b || dominio.endsWith('.' + b));

/** Comprueba la clave compartida con el script de Gmail. */
export function claveValida(recibida: string | null): boolean {
  const esperada = process.env.ZELLE_WEBHOOK_SECRET || '';
  if (esperada.length < 24 || !recibida) return false;
  const a = Buffer.from(recibida);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * El aviso debe venir de un banco y Gmail debe haber verificado la firma (DKIM)
 * de ese mismo banco. Así un correo falso que diga "recibiste $85" no cuenta.
 */
export function remitenteVerificado(from: string, autenticacion: string): { ok: boolean; motivo?: string } {
  // Solo cuenta la cabecera que agrega el propio Gmail al recibir el correo
  if (!/^authentication-results:\s*mx\.google\.com/i.test(autenticacion.trim())) {
    return { ok: false, motivo: 'Falta la verificación de Gmail (Authentication-Results)' };
  }
  const bancos = bancosPermitidos();
  const correo = (from.match(/<([^>]+)>/)?.[1] || from).trim().toLowerCase();
  const dominio = correo.split('@')[1] || '';
  if (!dominio || !esDeBanco(dominio, bancos)) return { ok: false, motivo: `Remitente no es un banco permitido (${dominio || 'sin dominio'})` };
  const firmas = [...autenticacion.toLowerCase().matchAll(/dkim=pass[^;]*?header\.(?:d|i)=@?([a-z0-9.-]+)/g)].map((m) => m[1]);
  if (!firmas.some((d) => esDeBanco(d, bancos) && (dominio === d || dominio.endsWith('.' + d) || d.endsWith('.' + dominio) || d === dominio))) {
    return { ok: false, motivo: 'Gmail no verificó la firma del banco (DKIM)' };
  }
  return { ok: true };
}

export interface AvisoLeido {
  monto: number | null;
  referencia: string | null;
}

/** Saca del aviso el monto recibido y la referencia SC-/RC- que puso el cliente. */
export function leerAviso(asunto: string, cuerpo: string): AvisoLeido {
  const texto = `${asunto}\n${cuerpo}`.replace(/ /g, ' ');
  // Si el aviso trae varios importes (saldo, límites...), se toma el menor:
  // así un saldo grande nunca hace pasar un pago pequeño por uno completo.
  const importes = [...`${asunto}\n${cuerpo.slice(0, 2000)}`.matchAll(/\$\s?(\d{1,3}(?:,\d{3})+(?:\.\d{2})?|\d+(?:\.\d{2})?)/g)]
    .map((m) => Number(m[1].replace(/,/g, '')))
    .filter((n) => n > 0);
  const monto = importes.length ? Math.min(...importes) : null;
  const r = texto.match(/\b(SC|RC)\s*[-–]?\s*(\d{1,6})\b/i);
  const referencia = r ? `${r[1].toUpperCase()}-${r[2].padStart(6, '0')}` : null;
  return { monto: monto && monto > 0 ? monto : null, referencia };
}

/** Avisos de dinero que SALE de la cuenta (no son pagos de clientes). */
export const esEnvioPropio = (asunto: string, cuerpo: string) =>
  /\byou sent\b|\byou've sent\b|\benviaste\b|\bhas enviado\b|\bpayment sent\b|\brequest(ed)? (money|payment)\b/i.test(`${asunto}\n${cuerpo.slice(0, 600)}`);

// ── Registro de avisos (para no aplicar dos veces el mismo correo) ──
let tablaLista = false;
async function asegurarTablaAvisos() {
  if (tablaLista) return;
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AvisoZelle" (
      "id" SERIAL PRIMARY KEY,
      "mensajeId" TEXT NOT NULL UNIQUE,
      "remitente" TEXT,
      "asunto" TEXT,
      "monto" DOUBLE PRECISION,
      "referencia" TEXT,
      "resultado" TEXT NOT NULL,
      "detalle" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
  tablaLista = true;
}

export type Resultado = 'aplicado' | 'ya_pagado' | 'revisar' | 'ignorado' | 'duplicado';

export interface Aviso {
  mensajeId: string;
  from: string;
  asunto: string;
  cuerpo: string;
  autenticacion: string;
}

export async function procesarAviso(a: Aviso): Promise<{ resultado: Resultado; detalle: string; referencia?: string | null; monto?: number | null }> {
  await asegurarTablaAvisos();
  const previo = await db.$queryRawUnsafe<{ resultado: string; detalle: string | null }[]>(
    `SELECT "resultado", "detalle" FROM "AvisoZelle" WHERE "mensajeId" = $1`,
    a.mensajeId
  );
  if (previo[0]) return { resultado: 'duplicado', detalle: `Ya procesado: ${previo[0].resultado}` };

  const { monto, referencia } = leerAviso(a.asunto, a.cuerpo);
  const salida = await decidir(a, monto, referencia);
  await db.$executeRawUnsafe(
    `INSERT INTO "AvisoZelle" ("mensajeId","remitente","asunto","monto","referencia","resultado","detalle")
     VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT ("mensajeId") DO NOTHING`,
    a.mensajeId,
    a.from.slice(0, 200),
    a.asunto.slice(0, 300),
    monto,
    referencia,
    salida.resultado,
    salida.detalle.slice(0, 500)
  );
  if (salida.resultado !== 'ignorado') console.log(`[zelle] ${a.mensajeId}: ${salida.resultado} — ${salida.detalle}`);
  return { ...salida, referencia, monto };
}

async function decidir(a: Aviso, monto: number | null, referencia: string | null): Promise<{ resultado: Resultado; detalle: string }> {
  const remitente = remitenteVerificado(a.from, a.autenticacion);
  if (!remitente.ok) return { resultado: 'ignorado', detalle: remitente.motivo! };
  if (!/zelle/i.test(`${a.asunto}\n${a.cuerpo}`)) return { resultado: 'ignorado', detalle: 'No es un aviso de Zelle' };
  if (esEnvioPropio(a.asunto, a.cuerpo)) return { resultado: 'ignorado', detalle: 'Es un envío o solicitud propia, no un pago recibido' };
  if (!monto) return { resultado: 'revisar', detalle: 'No se encontró el monto en el aviso' };
  if (!referencia) return { resultado: 'revisar', detalle: `Pago de $${monto.toFixed(2)} sin referencia SC-/RC- en la nota` };

  // Solo se automatizan las balitas de gas (RC-). El combustible (SC-) se
  // sigue confirmando a mano en el panel.
  if (referencia.startsWith('SC-') && process.env.ZELLE_AUTO_COMBUSTIBLE !== '1') {
    return { resultado: 'revisar', detalle: `${referencia} es de combustible: confirmar a mano en el panel` };
  }
  if (referencia.startsWith('SC-')) {
    await asegurarTablaSolicitudes();
    const sol = await db.solicitudCombustible.findUnique({ where: { numero: referencia } });
    if (!sol) return { resultado: 'revisar', detalle: `No existe la solicitud ${referencia}` };
    if (sol.estado === 'pagada') return { resultado: 'ya_pagado', detalle: `${referencia} ya estaba pagada` };
    if (sol.estado !== 'pendiente_pago') return { resultado: 'revisar', detalle: `${referencia} está ${sol.estado}` };
    if (monto + 0.009 < sol.montoUsd) {
      return { resultado: 'revisar', detalle: `${referencia}: llegaron $${monto.toFixed(2)} y cuesta $${sol.montoUsd.toFixed(2)}` };
    }
    const r = await confirmarSolicitudCombustible(sol.id);
    if (!r.ok) return { resultado: 'revisar', detalle: `${referencia}: ${r.error}${r.detalle ? ` (${r.detalle})` : ''}` };
    try {
      const destino = await enviarPinCombustible(r.data);
      return { resultado: 'aplicado', detalle: `${referencia} pagada; PIN enviado a ${destino}` };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { resultado: 'revisar', detalle: `${referencia} pagada y PIN generado, pero no se pudo enviar el correo: ${msg}` };
    }
  }

  await asegurarTablaReservas();
  const filas = await db.$queryRawUnsafe<Reserva[]>(`SELECT * FROM "ReservaCilindro" WHERE "numero" = $1`, referencia);
  const res = filas[0];
  if (!res) return { resultado: 'revisar', detalle: `No existe la reserva ${referencia}` };
  if (res.estado !== 'pendiente_pago') {
    return res.estado === 'anulada'
      ? { resultado: 'revisar', detalle: `${referencia} está anulada` }
      : { resultado: 'ya_pagado', detalle: `${referencia} ya estaba pagada` };
  }
  if (monto + 0.009 < Number(res.montoUsd)) {
    return { resultado: 'revisar', detalle: `${referencia}: llegaron $${monto.toFixed(2)} y cuesta $${Number(res.montoUsd).toFixed(2)}` };
  }
  const r = await confirmarReservaCilindro(res.id, `aviso automático ${referencia}`);
  if (!r.ok) return { resultado: 'revisar', detalle: `${referencia}: ${r.error}` };
  if (r.correo === 'enviado') return { resultado: 'aplicado', detalle: `${referencia} pagada; PIN enviado por correo` };
  return {
    resultado: 'revisar',
    detalle: `${referencia} pagada (PIN ${r.data.pin}), pero ${r.correo === 'sin_email' ? 'el cliente no dejó email' : 'falló el correo'}: avísale el PIN`,
  };
}
