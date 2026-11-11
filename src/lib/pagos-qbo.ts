// ═══════════════════════════════════════════════════════════════
// Pagos con QuickBooks para balitas de gas y combustible.
//  - Al crear la reserva/solicitud se genera la factura con pago en línea.
//  - Solo se confirma (PIN de recogida / orden en CUPET) cuando
//    QuickBooks registra la factura como pagada.
//  - Mientras QuickBooks no esté conectado, sigue el flujo manual (Zelle).
// ═══════════════════════════════════════════════════════════════
import { db } from '@/lib/db';
import { enviarCorreo } from '@/lib/mailer';
import { cupetPost } from '@/lib/cupet-proxy';
import { asegurarTablaSolicitudes } from '@/lib/asegurar-tabla-cupet';
import {
  asegurarTablaReservas,
  loteActual,
  nuevoPin,
  ahoraEnCuba,
  HORA_CIERRE,
  puntoDe,
  esc,
  fechaLarga,
  type Reserva,
} from '@/lib/cilindros';
import { qboConectado, crearFactura, facturaPagada, enlacePago } from '@/lib/quickbooks';

type Resultado<T> = { ok: true; data: T } | { ok: false; error: string; status: number; detalle?: string };

// ─── Facturas ────────────────────────────────────────────────────

/** Crea (una sola vez) la factura de QuickBooks de la reserva. Devuelve el enlace de pago. */
export async function facturarReserva(r: Reserva): Promise<string | null> {
  if (r.qboPagoUrl) return r.qboPagoUrl;
  if (!(await qboConectado()) || !r.emailComprador) return null;
  let invoiceId = r.qboInvoiceId;
  let pagoUrl: string | null = null;
  if (invoiceId) pagoUrl = await enlacePago(invoiceId);
  else {
    const f = await crearFactura({
      numero: r.numero,
      nombre: r.nombreComprador,
      email: r.emailComprador,
      producto: 'Balita de gas',
      descripcion: `${r.cantidad} balita(s) de gas llena(s) · Recoge ${r.nombreRecoge} (carnet ${r.carnetRecoge}) en ${puntoDe(r.punto).nombre}`,
      monto: r.montoUsd,
    });
    invoiceId = f.invoiceId;
    pagoUrl = f.pagoUrl;
  }
  await db.$executeRawUnsafe(
    `UPDATE "ReservaCilindro" SET "qboInvoiceId"=$2, "qboPagoUrl"=$3 WHERE "id"=$1`,
    r.id,
    invoiceId,
    pagoUrl
  );
  return pagoUrl;
}

interface SolicitudFacturable {
  id: number;
  numero: string;
  nombreComprador: string;
  emailComprador: string | null;
  nombreBeneficiario: string;
  ciBeneficiario: string;
  servicenterNombre: string;
  typeFuelNombre: string;
  litros: number;
  montoUsd: number;
  qboInvoiceId: string | null;
  qboPagoUrl: string | null;
}

export async function facturarSolicitud(s: SolicitudFacturable): Promise<string | null> {
  if (s.qboPagoUrl) return s.qboPagoUrl;
  if (!(await qboConectado()) || !s.emailComprador) return null;
  let invoiceId = s.qboInvoiceId;
  let pagoUrl: string | null = null;
  if (invoiceId) pagoUrl = await enlacePago(invoiceId);
  else {
    const f = await crearFactura({
      numero: s.numero,
      nombre: s.nombreComprador,
      email: s.emailComprador,
      producto: 'Combustible',
      descripcion: `${s.litros} L de ${s.typeFuelNombre} en ${s.servicenterNombre} · Beneficiario ${s.nombreBeneficiario} (CI ${s.ciBeneficiario})`,
      monto: s.montoUsd,
    });
    invoiceId = f.invoiceId;
    pagoUrl = f.pagoUrl;
  }
  await db.solicitudCombustible.update({ where: { id: s.id }, data: { qboInvoiceId: invoiceId, qboPagoUrl: pagoUrl } });
  return pagoUrl;
}

/**
 * ¿Se puede confirmar el pago? Con QuickBooks conectado, solo si
 * QuickBooks marca la factura como pagada. Sin QuickBooks, el admin decide.
 */
async function pagoAutorizado(qboInvoiceId: string | null): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await qboConectado())) return { ok: true };
  if (!qboInvoiceId) return { ok: false, error: 'Esta reserva no tiene factura de QuickBooks; el cliente aún no ha pagado' };
  try {
    if (await facturaPagada(qboInvoiceId)) return { ok: true };
    return { ok: false, error: 'QuickBooks todavía no confirma el pago de esta factura' };
  } catch (e) {
    console.error('[qbo] No se pudo consultar la factura:', e instanceof Error ? e.message : e);
    return { ok: false, error: 'No se pudo consultar QuickBooks. Intenta de nuevo en unos minutos' };
  }
}

// ─── Confirmación: balitas de gas ────────────────────────────────

export async function confirmarReserva(
  id: number,
  referencia = ''
): Promise<Resultado<{ reserva: Reserva; correo: 'enviado' | 'sin_email' | 'fallo'; movidaAlLote: string | null; yaConfirmada?: boolean }>> {
  await asegurarTablaReservas();
  const filas = await db.$queryRawUnsafe<Reserva[]>(`SELECT * FROM "ReservaCilindro" WHERE "id" = $1`, id);
  const r = filas[0];
  if (!r) return { ok: false, error: 'Reserva no encontrada', status: 404 };
  if (r.estado !== 'pendiente_pago') {
    return { ok: true, data: { reserva: r, correo: 'sin_email', movidaAlLote: null, yaConfirmada: true } };
  }

  const pago = await pagoAutorizado(r.qboInvoiceId);
  if (!pago.ok) return { ok: false, error: pago.error, status: 409 };
  const nota = r.qboInvoiceId ? 'Pagado en QuickBooks' : referencia ? `Zelle: ${referencia}` : '';

  // Si su día ya cerró (pasadas las 8 PM de ese lote), pasa al listado abierto
  const { dia, hora } = ahoraEnCuba();
  const loteCerrado = r.lote < dia || (r.lote === dia && hora >= HORA_CIERRE);
  const lote = loteCerrado ? loteActual() : r.lote;

  const pin = nuevoPin();
  const act = await db.$queryRawUnsafe<Reserva[]>(
    `UPDATE "ReservaCilindro" SET "estado"='pagada', "pin"=$2, "pagadaEn"=NOW(), "lote"=$3,
       "notas" = CASE WHEN $4::text = '' THEN "notas" ELSE $4::text END
     WHERE "id"=$1 AND "estado"='pendiente_pago' RETURNING *`,
    id,
    pin,
    lote,
    nota
  );
  const reserva = act[0];
  if (!reserva) return { ok: false, error: 'La reserva cambió; recarga', status: 409 };

  let correo: 'enviado' | 'sin_email' | 'fallo' = 'sin_email';
  if (reserva.emailComprador) {
    try {
      await enviarCorreo({
        to: reserva.emailComprador,
        subject: `Tu PIN de recogida: ${pin} — Reserva ${reserva.numero}`,
        text: `Pago confirmado. PIN de recogida: ${pin}. Reserva ${reserva.numero}: ${reserva.cantidad} cilindro(s). Recoge ${reserva.nombreRecoge} (carnet ${reserva.carnetRecoge}) a partir del listado del ${reserva.lote} en ${puntoDe(reserva.punto).direccion}. Debe presentar el carnet y decir el PIN.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111827">
          <h2 style="color:#071a46">Pago confirmado</h2>
          <p>Hola ${esc(reserva.nombreComprador)}, tu reserva <b>${esc(reserva.numero)}</b> está pagada.</p>
          <p style="font-size:34px;font-weight:800;letter-spacing:8px;background:#071a46;color:#7ed957;text-align:center;padding:18px;border-radius:12px;font-family:monospace">${pin}</p>
          <p><b>${reserva.cantidad}</b> cilindro(s) lleno(s), sin entrega de vacío.<br>
          Recoge: <b>${esc(reserva.nombreRecoge)}</b> · Carnet ${esc(reserva.carnetRecoge)}<br>
          Listado del ${esc(fechaLarga(reserva.lote))}<br>
          Lugar: ${esc(puntoDe(reserva.punto).direccion)}</p>
          <p style="color:#6b7280;font-size:13px">Al llegar, presenta el carnet de identidad y di este PIN.</p>
        </div>`,
      });
      correo = 'enviado';
    } catch (e) {
      console.error('[cilindros] No se pudo enviar el PIN por correo:', e instanceof Error ? e.message : e);
      correo = 'fallo';
    }
  }
  return { ok: true, data: { reserva, correo, movidaAlLote: loteCerrado ? lote : null } };
}

// ─── Confirmación: combustible ───────────────────────────────────

export async function confirmarSolicitud(id: number) {
  await asegurarTablaSolicitudes();
  const sol = await db.solicitudCombustible.findUnique({ where: { id } });
  if (!sol) return { ok: false as const, error: 'Solicitud no encontrada', status: 404 };
  if (sol.estado === 'pagada') return { ok: true as const, data: sol, yaPagada: true };
  if (sol.estado === 'anulada') return { ok: false as const, error: 'Solicitud anulada', status: 400 };

  const pago = await pagoAutorizado(sol.qboInvoiceId);
  if (!pago.ok) return { ok: false as const, error: pago.error, status: 409 };

  // Registrar la orden en CUPET (por el túnel)
  const r = await cupetPost('/cupet/orden', {
    servicenterId: sol.servicenterId,
    typeFuelId: sol.typeFuelId,
    amount: sol.litros,
    identifyProvider: sol.ciBeneficiario,
    nameProvider: sol.nombreBeneficiario,
    phoneProvider: sol.telefonoCuba,
    bankId: process.env.CUPET_BANK_ID || '12',
    amountPaid: sol.montoUsd,
    currency: 'USD',
  });
  const json = await r.json();

  if (json.ok && json.data?.transactionId) {
    const actualizada = await db.solicitudCombustible.update({
      where: { id: sol.id },
      data: {
        estado: 'pagada',
        metodoPago: sol.qboInvoiceId ? 'QUICKBOOKS' : sol.metodoPago,
        cupetExternalId: json.externalId,
        cupetTransactionId: json.data.transactionId,
        pin: json.data.pin,
        expiracionPin: json.data.expirationDate ? new Date(json.data.expirationDate) : null,
      },
    });
    return { ok: true as const, data: actualizada };
  }

  // CUPET rechazó la orden: la solicitud queda pendiente con el motivo
  return {
    ok: false as const,
    error: 'CUPET rechazó la orden',
    detalle: String(json.data?.errors?.[0] || json.data?.message || json.error || 'Sin detalle'),
    code: json.data?.code,
    status: 502,
  };
}

// ─── Sincronización (webhook de QuickBooks y tarea programada) ───

/** Revisa todas las facturas pendientes y confirma las que QuickBooks ya cobró. */
export async function sincronizarPagos(): Promise<{ revisadas: number; confirmadas: string[]; errores: string[] }> {
  const out = { revisadas: 0, confirmadas: [] as string[], errores: [] as string[] };
  if (!(await qboConectado())) return out;
  await Promise.all([asegurarTablaReservas(), asegurarTablaSolicitudes()]);

  // Reintenta las facturas que no se pudieron crear al reservar (últimos 7 días)
  const sinFactura = await db.$queryRawUnsafe<Reserva[]>(
    `SELECT * FROM "ReservaCilindro" WHERE "estado"='pendiente_pago' AND "qboInvoiceId" IS NULL
       AND "createdAt" > NOW() - INTERVAL '7 days'`
  );
  for (const r of sinFactura) {
    await facturarReserva(r).catch((e) => out.errores.push(`${r.numero}: ${e instanceof Error ? e.message : String(e)}`));
  }
  const solSinFactura = await db.solicitudCombustible.findMany({
    where: { estado: 'pendiente_pago', qboInvoiceId: null, createdAt: { gt: new Date(Date.now() - 7 * 864e5) } },
  });
  for (const s of solSinFactura) {
    await facturarSolicitud(s).catch((e) => out.errores.push(`${s.numero}: ${e instanceof Error ? e.message : String(e)}`));
  }

  const reservas = await db.$queryRawUnsafe<{ id: number; numero: string; qboInvoiceId: string }[]>(
    `SELECT "id","numero","qboInvoiceId" FROM "ReservaCilindro" WHERE "estado"='pendiente_pago' AND "qboInvoiceId" IS NOT NULL`
  );
  const solicitudes = await db.solicitudCombustible.findMany({
    where: { estado: 'pendiente_pago', qboInvoiceId: { not: null } },
    select: { id: true, numero: true, qboInvoiceId: true },
  });

  for (const r of reservas) {
    out.revisadas++;
    try {
      if (!(await facturaPagada(r.qboInvoiceId))) continue;
      const res = await confirmarReserva(r.id);
      if (res.ok) out.confirmadas.push(r.numero);
      else out.errores.push(`${r.numero}: ${res.error}`);
    } catch (e) {
      out.errores.push(`${r.numero}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  for (const s of solicitudes) {
    out.revisadas++;
    try {
      if (!(await facturaPagada(s.qboInvoiceId!))) continue;
      const res = await confirmarSolicitud(s.id);
      if (res.ok) out.confirmadas.push(s.numero);
      else out.errores.push(`${s.numero}: ${res.error}${'detalle' in res && res.detalle ? ` (${res.detalle})` : ''}`);
    } catch (e) {
      out.errores.push(`${s.numero}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return out;
}
