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
    salida.asignada ?? referencia,
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

  // Un Zelle real que entró pero no se pudo aplicar solo: avisar a ventas, en palabras claras
  if (salida.resultado === 'revisar' && monto) {
    const aviso = avisoVentas(monto, referencia, salida.detalle, salida.candidatas ?? [], pedidos);
    await enviarCorreo({ to: ZELLE_DESTINO, ...aviso }).catch((e) =>
      console.error('[zelle] No se pudo avisar a ventas:', e instanceof Error ? e.message : e)
    );
  }
  return { resultado: salida.resultado, detalle: salida.detalle, referencia: salida.asignada ?? referencia, monto };
}

async function decidir(a: Aviso, monto: number | null, referencia: string | null): Promise<{ resultado: Resultado; detalle: string; asignada?: string; candidatas?: Reserva[] }> {
  const remitente = remitenteVerificado(a.from, a.autenticacion);
  if (!remitente.ok) {
    // El cliente respondió desde su correo con su RC-: se le asigna el Zelle sin referencia que llegó por ese importe
    const respuesta = await reclamarPorRespuesta(a, referencia).catch((e) => {
      console.error('[zelle] Error con la respuesta del cliente:', e instanceof Error ? e.message : e);
      return null;
    });
    return respuesta ?? { resultado: 'ignorado', detalle: remitente.motivo! };
  }
  if (!/zelle/i.test(`${a.asunto}\n${a.cuerpo}`)) return { resultado: 'ignorado', detalle: 'No es un aviso de Zelle' };
  if (esEnvioPropio(a.asunto, a.cuerpo)) return { resultado: 'ignorado', detalle: 'Es un envío o solicitud propia, no un pago recibido' };
  // Sin importe no es un aviso de pago (alta en Zelle, códigos de verificación...)
  if (!monto) return { resultado: 'ignorado', detalle: 'Aviso de Zelle sin importe: no es un pago' };
  if (!referencia) return asignarSinReferencia(monto, a);

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
  // Decisión del 2026-11-10: si el pago llega, se confirma y se envía el PIN aunque
  // haya pasado la hora de apartado (queda anotado para ventas).
  const minutos = (Date.now() - new Date(res.createdAt).getTime()) / 60000;
  const tarde = minutos > HORAS_APARTADO * 60 + 30 ? ` (pagó ${Math.round(minutos)} min después de reservar)` : '';
  const r = await confirmarReservaCilindro(res.id, `aviso automático ${referencia}${tarde}`, { monto, asunto: a.asunto });
  if (!r.ok) return { resultado: 'revisar', detalle: `${referencia}: ${r.error}` };
  if (r.correo === 'enviado') return { resultado: 'aplicado', detalle: `${referencia} pagada; PIN enviado por correo${tarde}` };
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
        text: `Hola ${r.nombreComprador}. Recibimos un pago por Zelle de ${montoTxt} sin número de reserva en la nota. Tu compra ${r.numero} por ese importe aparece sin pagar${otras}. Si ese pago fue tuyo, responde a este correo (sin cambiar el asunto) y te enviamos el PIN de recogida automáticamente. Si todavía no has pagado, ignora este correo y recuerda escribir ${r.numero} en la nota (memo) del Zelle.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111827">
          <h2 style="color:#071a46">¿Pagaste ${montoTxt} por Zelle?</h2>
          <p>Hola ${esc(r.nombreComprador)}, recibimos un pago por Zelle de <b>${montoTxt}</b> <b>sin número de reserva</b> en la nota, así que el sistema no sabe de quién es.</p>
          <p>Tu compra <b>${esc(r.numero)}</b> por ese importe aparece todavía sin pagar${esc(otras)}.</p>
          <p style="padding:12px;border-radius:10px;background:#ecfdf5;border:1px solid #a7f3d0"><b>Si ese pago fue tuyo:</b> responde a este correo sin cambiar el asunto (basta con escribir
          <b style="font-family:monospace;font-size:18px">${esc(r.numero)}</b>). Lo registramos y te enviamos el PIN de recogida automáticamente.</p>
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

const VENTANA_SIN_REF_HORAS = 24;

/** Correo del remitente, si Gmail verificó la firma (DKIM) de su dominio. */
function remitenteFirmado(a: Aviso): string | null {
  if (!/^authentication-results:\s*mx\.google\.com/i.test(a.autenticacion.trim())) return null;
  const correo = (a.from.match(/<([^>]+)>/)?.[1] || a.from).trim().toLowerCase();
  const dominio = correo.split('@')[1] || '';
  if (!dominio) return null;
  const firmas = [...a.autenticacion.toLowerCase().matchAll(/dkim=pass[^;]*?header\.(?:d|i)=@?([a-z0-9.-]+)/g)].map((m) => m[1]);
  return firmas.some((d) => d === dominio || dominio.endsWith('.' + d)) ? correo : null;
}

/**
 * Llegó un Zelle de verdad sin RC- en la nota. Si solo una persona tiene compras
 * sin pagar por ese importe (últimas 24 h, hechas antes del pago), es suya: se
 * confirma y se envía el PIN. Si hay varias, queda para que el cliente responda.
 */
async function asignarSinReferencia(monto: number, a: Aviso): Promise<{ resultado: Resultado; detalle: string; asignada?: string; candidatas?: Reserva[] }> {
  await asegurarTablaReservas();
  const filas = await db.$queryRawUnsafe<Reserva[]>(
    `SELECT * FROM "ReservaCilindro"
     WHERE "estado" = 'pendiente_pago' AND ABS("montoUsd"::float8 - $1::float8) < 0.01
       AND "createdAt" > NOW() - INTERVAL '${VENTANA_SIN_REF_HORAS} hours'
     ORDER BY "createdAt" DESC`,
    monto
  );
  const persona = (r: Reserva) => (r.emailComprador || '').trim().toLowerCase() || String(r.telefonoComprador || '').replace(/\D/g, '').slice(-8);
  const personas = new Set(filas.map(persona));
  const base = `Pago de $${monto.toFixed(2)} sin referencia en la nota`;
  if (filas.length === 0) return { resultado: 'revisar', detalle: `${base}: no hay compras sin pagar por ese importe` };
  if (personas.size > 1) return { resultado: 'revisar', detalle: `${base}: ${personas.size} personas tienen compras sin pagar por ese importe (${filas.map((f) => f.numero).join(', ')})`, candidatas: filas };
  const res = filas[0]; // la más reciente de esa persona
  const r = await confirmarReservaCilindro(res.id, `Zelle sin referencia: única compra de $${monto.toFixed(2)}`, { monto, asunto: a.asunto });
  if (!r.ok) return { resultado: 'revisar', detalle: `${base}; se intentó ${res.numero}: ${r.error}` };
  const detalle = `${base}: era la única compra por ese importe, ${res.numero} pagada`;
  if (r.correo === 'enviado') return { resultado: 'aplicado', detalle: `${detalle}; PIN enviado por correo`, asignada: res.numero };
  return { resultado: 'revisar', detalle: `${detalle} (PIN ${r.data.pin}), pero ${r.correo === 'sin_email' ? 'el cliente no dejó email' : 'falló el correo'}: avísale el PIN`, asignada: res.numero };
}

/**
 * Respuesta del cliente al correo "¿Pagaste $X por Zelle?": si escribe desde el
 * mismo correo de la compra RC- y hay un Zelle real sin referencia por ese importe
 * aún sin asignar, se le asigna, se confirma y se envía el PIN.
 */
async function reclamarPorRespuesta(a: Aviso, referencia: string | null): Promise<{ resultado: Resultado; detalle: string; asignada?: string } | null> {
  if (!referencia || !referencia.startsWith('RC-')) return null;
  if (!/^\s*re\s*:/i.test(a.asunto) || !/falta tu n[uú]mero de reserva/i.test(a.asunto)) return null;
  const correo = remitenteFirmado(a);
  if (!correo) return { resultado: 'ignorado', detalle: 'Respuesta de cliente sin firma verificada' };
  await asegurarTablaReservas();
  const filas = await db.$queryRawUnsafe<Reserva[]>(`SELECT * FROM "ReservaCilindro" WHERE "numero" = $1`, referencia);
  const res = filas[0];
  if (!res || res.estado !== 'pendiente_pago') return { resultado: 'ignorado', detalle: `Respuesta de cliente: ${referencia} no está pendiente de pago` };
  if ((res.emailComprador || '').trim().toLowerCase() !== correo) {
    return { resultado: 'ignorado', detalle: `Respuesta de ${correo}: no es el correo de la compra ${referencia}` };
  }
  await asegurarTablaAvisos();
  // Se toma el Zelle sin referencia por ese importe, llegado después de la compra; un solo dueño por Zelle
  const tomado = await db.$queryRawUnsafe<{ id: number; monto: number }[]>(
    `UPDATE "AvisoZelle" SET "referencia" = $1, "resultado" = 'aplicado',
       "detalle" = LEFT(COALESCE("detalle", '') || ' → asignado a ' || $1 || ' por respuesta del cliente', 500)
     WHERE "id" = (
       SELECT "id" FROM "AvisoZelle"
       WHERE "resultado" = 'revisar' AND "referencia" IS NULL AND ABS("monto" - $2::float8) < 0.01
         AND "createdAt" > NOW() - INTERVAL '${VENTANA_SIN_REF_HORAS} hours'
         AND "createdAt" >= $3::timestamp - INTERVAL '5 minutes'
       ORDER BY "createdAt" LIMIT 1 FOR UPDATE SKIP LOCKED)
     RETURNING "id", "monto"`,
    referencia,
    Number(res.montoUsd),
    new Date(res.createdAt)
  );
  if (!tomado[0]) return { resultado: 'ignorado', detalle: `${referencia} dice que pagó, pero no hay un Zelle sin referencia de $${Number(res.montoUsd).toFixed(2)} sin asignar` };
  const r = await confirmarReservaCilindro(res.id, `Zelle sin referencia, confirmado por respuesta del cliente`, { monto: tomado[0].monto, asunto: a.asunto });
  if (!r.ok) return { resultado: 'revisar', detalle: `${referencia}: ${r.error}` };
  if (r.correo === 'enviado') return { resultado: 'aplicado', detalle: `${referencia} pagada por respuesta del cliente; PIN enviado`, asignada: referencia };
  return { resultado: 'revisar', detalle: `${referencia} pagada (PIN ${r.data.pin}), pero falló el correo: avísale el PIN`, asignada: referencia };
}

const horaCuba = (d: Date | string) =>
  new Date(d).toLocaleString('es-ES', { timeZone: 'America/Havana', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** Correo a ventas cuando un Zelle no se pudo confirmar solo: qué pasó, de quién puede ser y qué hacer. */
export function avisoVentas(
  monto: number,
  referencia: string | null,
  detalle: string,
  candidatas: Reserva[],
  pedidos: { numero: string; nombre: string; email: string }[]
): { subject: string; text: string; html: string } {
  const montoTxt = `$${monto.toFixed(2)}`;
  const ahora = Date.now();
  const sinRef = !referencia;
  const que = sinRef
    ? `Entró un Zelle de ${montoTxt} (${horaCuba(new Date())}, hora de Cuba) pero quien pagó NO escribió el número RC- en la nota. La página no sabe de quién es, así que no confirmó ninguna compra ni envió PIN.`
    : `Entró un Zelle de ${montoTxt} con la referencia ${referencia}, pero no se pudo confirmar solo: ${detalle}.`;
  const filas = candidatas.map((c, i) => {
    const min = Math.round((ahora - new Date(c.createdAt).getTime()) / 60000);
    const hace = min < 120 ? `hace ${min} min` : `hace ${Math.round(min / 60)} h`;
    return { c, hace, probable: i === 0 };
  });
  const pedidosTxt = pedidos.length
    ? `Ya le escribimos a ${pedidos.map((p) => `${p.nombre} (${p.numero})`).join(', ')} preguntándole si el pago es suyo. Si responde al correo, su compra se confirma sola y le llega el PIN.`
    : '';
  const pasos = sinRef
    ? [
        'Abre el aviso del banco (Wells Fargo) de este pago y mira el NOMBRE de quien envió el dinero.',
        'Busca a esa persona en la lista de abajo (o en ambitosmax.com/admin → Cilindros → Registro / buscador).',
        'En ambitosmax.com/admin → Cilindros, pulsa "Confirmar pago" en su número RC-. Le llega el PIN por correo.',
      ]
    : [`Revisa la compra ${referencia} en ambitosmax.com/admin → Cilindros y, si corresponde, pulsa "Confirmar pago". Le llega el PIN por correo.`];

  const text = [
    `QUÉ PASÓ: ${que}`,
    '',
    'QUÉ HACER:',
    ...pasos.map((p, i) => `${i + 1}. ${p}`),
    ...(filas.length ? ['', `COMPRAS SIN PAGAR POR ${montoTxt} (la primera es la más probable):`] : []),
    ...filas.map(({ c, hace, probable }) =>
      `- ${c.numero}${probable ? ' (MÁS PROBABLE)' : ''} · ${c.nombreComprador} · tel ${c.telefonoComprador} · recoge ${c.nombreRecoge} · compró ${hace}`),
    ...(pedidosTxt ? ['', pedidosTxt] : []),
    '',
    'Mientras no se confirme, no se descuenta inventario ni se envía PIN.',
  ].join('\n');

  const tabla = filas.length
    ? `<p style="margin:16px 0 6px"><b>Compras sin pagar por ${montoTxt}</b> (la primera es la más probable):</p>
       <table style="width:100%;border-collapse:collapse;font-size:13px">${filas
         .map(({ c, hace, probable }) => `<tr style="background:${probable ? '#ecfdf5' : '#fff'}">
           <td style="padding:6px;border:1px solid #e5e7eb;font-family:monospace;font-weight:bold">${esc(c.numero)}${probable ? '<br><span style="color:#047857;font-family:Arial">más probable</span>' : ''}</td>
           <td style="padding:6px;border:1px solid #e5e7eb"><b>${esc(c.nombreComprador)}</b><br>${esc(c.telefonoComprador)}</td>
           <td style="padding:6px;border:1px solid #e5e7eb">Recoge: ${esc(c.nombreRecoge)}</td>
           <td style="padding:6px;border:1px solid #e5e7eb;white-space:nowrap">compró ${hace}</td></tr>`)
         .join('')}</table>`
    : '';

  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#111827">
    <h2 style="color:#b45309;margin-bottom:4px">${sinRef ? `Zelle de ${montoTxt} sin número RC-: falta saber de quién es` : `Zelle de ${montoTxt} (${esc(referencia!)}) sin confirmar`}</h2>
    <p><b>Qué pasó:</b> ${esc(que)}</p>
    <div style="padding:12px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe">
      <b>Qué hacer:</b><ol style="margin:6px 0 0;padding-left:20px">${pasos.map((p) => `<li style="margin-bottom:4px">${esc(p)}</li>`).join('')}</ol>
    </div>
    ${tabla}
    ${pedidosTxt ? `<p style="padding:10px;border-radius:8px;background:#f0fdf4;border:1px solid #bbf7d0">${esc(pedidosTxt)}</p>` : ''}
    <p style="color:#6b7280;font-size:12px">Mientras no se confirme, no se descuenta inventario ni se envía PIN.</p>
  </div>`;

  const quien = filas[0] ? ` · probable ${filas[0].c.numero} ${filas[0].c.nombreComprador}` : '';
  return {
    subject: sinRef
      ? `Zelle de ${montoTxt} SIN número RC- — confirmar a quién${quien}`
      : `Zelle de ${montoTxt} ${referencia} sin confirmar — revisar`,
    text,
    html,
  };
}
