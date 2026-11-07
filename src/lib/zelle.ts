import { timingSafeEqual } from 'crypto';
import { db } from '@/lib/db';
import { asegurarTablaSolicitudes } from '@/lib/asegurar-tabla-cupet';
import { asegurarTablaReservas, type Reserva, ZELLE_DESTINO, esc } from '@/lib/cilindros';
import { enviarCorreo } from '@/lib/mailer';
import { confirmarSolicitudCombustible, enviarPinCombustible } from '@/lib/pin-combustible';
import { confirmarReservaCilindro } from '@/lib/confirmar-reserva';
import { HORAS_APARTADO } from '@/lib/existencia';

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
  // Zelle sin referencia: pedir el RC- por correo a quien tiene una compra sin pagar por ese importe
  let pedidos: { numero: string; nombre: string; email: string }[] = [];
  if (salida.resultado === 'revisar' && monto && !referencia) {
    pedidos = await pedirReferencia(monto).catch((e) => {
      console.error('[zelle] No se pudo pedir la referencia:', e instanceof Error ? e.message : e);
      return [];
    });
  }

  // Un Zelle real que entró pero no se pudo aplicar solo: avisar a ventas para revisarlo
  if (salida.resultado === 'revisar' && monto) {
    const pedidosTxt = pedidos.length
      ? `Se pidió el número de reserva por correo a: ${pedidos.map((p) => `${p.numero} ${p.nombre} (${p.email})`).join(', ')}.`
      : referencia ? '' : 'No había compras sin pagar por ese importe con correo: no se pidió la referencia a nadie.';
    await enviarCorreo({
      to: ZELLE_DESTINO,
      subject: `Zelle recibido SIN aplicar · $${monto.toFixed(2)}${referencia ? ` · ${referencia}` : ''} — revisar`,
      text: `Llegó un Zelle de $${monto.toFixed(2)} pero no se confirmó solo: ${salida.detalle}. Aviso del banco: ${a.asunto}. No se descontó nada ni se envió PIN. ${pedidosTxt}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;color:#111827">
        <h2 style="color:#b45309">Zelle recibido sin aplicar: $${monto.toFixed(2)}</h2>
        <p><b>Motivo:</b> ${esc(salida.detalle)}</p>
        <p><b>Aviso del banco:</b> ${esc(a.asunto)}</p>
        <p>No se descontó nada del inventario ni se envió PIN. Si es de un cliente, confírmalo a mano en el panel.</p>
        ${pedidosTxt ? `<p style="padding:10px;border-radius:8px;background:#eff6ff">${esc(pedidosTxt)} Las respuestas llegan a este correo.</p>` : ''}
      </div>`,
    }).catch((e) => console.error('[zelle] No se pudo avisar a ventas:', e instanceof Error ? e.message : e));
  }
  return { ...salida, referencia, monto };
}

async function decidir(a: Aviso, monto: number | null, referencia: string | null): Promise<{ resultado: Resultado; detalle: string }> {
  const remitente = remitenteVerificado(a.from, a.autenticacion);
  if (!remitente.ok) return { resultado: 'ignorado', detalle: remitente.motivo! };
  if (!/zelle/i.test(`${a.asunto}\n${a.cuerpo}`)) return { resultado: 'ignorado', detalle: 'No es un aviso de Zelle' };
  if (esEnvioPropio(a.asunto, a.cuerpo)) return { resultado: 'ignorado', detalle: 'Es un envío o solicitud propia, no un pago recibido' };
  // Sin importe no es un aviso de pago (alta en Zelle, códigos de verificación...)
  if (!monto) return { resultado: 'ignorado', detalle: 'Aviso de Zelle sin importe: no es un pago' };
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
  // La compra aparta las balitas 1 hora. Si el Zelle llega pasada la hora (con
  // 30 min de margen por lo que tarda el aviso del banco), ya no se aplica solo:
  // ventas lo revisa y decide si quedan balitas.
  const minutos = (Date.now() - new Date(res.createdAt).getTime()) / 60000;
  if (minutos > HORAS_APARTADO * 60 + 30) {
    return { resultado: 'revisar', detalle: `${referencia}: pagó después de la hora de apartado (${Math.round(minutos)} min). Confirmar a mano si quedan balitas` };
  }
  const r = await confirmarReservaCilindro(res.id, `aviso automático ${referencia}`, { monto, asunto: a.asunto });
  if (!r.ok) return { resultado: 'revisar', detalle: `${referencia}: ${r.error}` };
  if (r.correo === 'enviado') return { resultado: 'aplicado', detalle: `${referencia} pagada; PIN enviado por correo` };
  return {
    resultado: 'revisar',
    detalle: `${referencia} pagada (PIN ${r.data.pin}), pero ${r.correo === 'sin_email' ? 'el cliente no dejó email' : 'falló el correo'}: avísale el PIN`,
  };
}

/**
 * Llegó un Zelle sin RC- en la nota: se escribe a cada cliente con una compra de
 * balitas sin pagar de las últimas 3 h por ese mismo importe (un correo por persona), pidiéndole que
 * responda con su número de reserva. No se confirma nada solo: ventas lo
 * confirma a mano cuando el cliente responde.
 */
async function pedirReferencia(monto: number): Promise<{ numero: string; nombre: string; email: string }[]> {
  await asegurarTablaReservas();
  const filas = await db.$queryRawUnsafe<Pick<Reserva, 'numero' | 'nombreComprador' | 'emailComprador' | 'montoUsd'>[]>(
    `SELECT "numero", "nombreComprador", "emailComprador", "montoUsd" FROM "ReservaCilindro"
     WHERE "estado" = 'pendiente_pago' AND "emailComprador" IS NOT NULL AND "emailComprador" <> ''
       AND ABS("montoUsd"::float8 - $1::float8) < 0.01 AND "createdAt" > NOW() - INTERVAL '3 hours'
     ORDER BY "createdAt" DESC LIMIT 20`,
    monto
  );
  const montoTxt = `$${monto.toFixed(2)}`;
  const enviados: { numero: string; nombre: string; email: string }[] = [];
  // Un solo correo por persona aunque haya reservado varias veces
  const porEmail = new Map<string, { nombre: string; numeros: string[] }>();
  for (const f of filas) {
    const k = String(f.emailComprador).trim().toLowerCase();
    const g = porEmail.get(k) || { nombre: f.nombreComprador, numeros: [] };
    g.numeros.push(f.numero);
    porEmail.set(k, g);
  }
  for (const [email, g] of porEmail) {
    const r = { nombreComprador: g.nombre, numero: g.numeros[0] }; // la más reciente
    const otras = g.numeros.length > 1 ? ` (también tienes sin pagar: ${g.numeros.slice(1).join(', ')})` : '';
    try {
      await enviarCorreo({
        to: email,
        replyTo: ZELLE_DESTINO,
        subject: `¿Pagaste ${montoTxt} por Zelle? Falta tu número de reserva ${r.numero}`,
        text: `Hola ${r.nombreComprador}. Recibimos un pago por Zelle de ${montoTxt} sin número de reserva en la nota. Tu compra ${r.numero} por ese importe aparece sin pagar${otras}. Si ese pago fue tuyo, responde a este correo con tu número ${r.numero} y el nombre de la persona que hizo el Zelle, para registrarlo y enviarte el PIN de recogida. Si todavía no has pagado, ignora este correo y recuerda escribir ${r.numero} en la nota (memo) del Zelle.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111827">
          <h2 style="color:#071a46">¿Pagaste ${montoTxt} por Zelle?</h2>
          <p>Hola ${esc(r.nombreComprador)}, recibimos un pago por Zelle de <b>${montoTxt}</b> <b>sin número de reserva</b> en la nota, así que el sistema no sabe de quién es.</p>
          <p>Tu compra <b>${esc(r.numero)}</b> por ese importe aparece todavía sin pagar${esc(otras)}.</p>
          <p style="padding:12px;border-radius:10px;background:#ecfdf5;border:1px solid #a7f3d0"><b>Si ese pago fue tuyo:</b> responde a este correo con tu número
          <b style="font-family:monospace;font-size:18px">${esc(r.numero)}</b> y el nombre de la persona que hizo el Zelle. Lo registramos y te enviamos el PIN de recogida.</p>
          <p style="color:#6b7280;font-size:13px">Si todavía no has pagado, ignora este correo y recuerda escribir ${esc(r.numero)} en la nota (memo) del Zelle.</p>
        </div>`,
      });
      enviados.push({ numero: g.numeros.join('/'), nombre: g.nombre, email });
    } catch (e) {
      console.error(`[zelle] No se pudo pedir la referencia a ${r.numero}:`, e instanceof Error ? e.message : e);
    }
  }
  return enviados;
}
