import { db } from '@/lib/db';
import { enviarCorreo } from '@/lib/mailer';
import { descontarBalitasPunto } from '@/lib/puntos-recogida';
import { descontarExistencia, itemsDeMetadata } from '@/lib/existencia';
import {
  asegurarTablaReservas,
  loteActual,
  nuevoPin,
  ahoraEnCuba,
  HORA_CIERRE,
  lugarDe,
  esc,
  fechaLarga,
  type Reserva, textoRecogida, ZELLE_DESTINO } from '@/lib/cilindros';

export type ResultadoReserva =
  | {
      ok: true;
      data: Reserva;
      yaConfirmada?: boolean;
      correo?: 'enviado' | 'sin_email' | 'fallo';
      movidaAlLote?: string | null;
    }
  | { ok: false; status: number; error: string };

// Pago recibido → PIN de recogida y correo al comprador.
// Lo usan el botón del panel y el aviso automático de Zelle.
export async function confirmarReservaCilindro(id: number, referencia: string): Promise<ResultadoReserva> {
  await asegurarTablaReservas();
  const filas = await db.$queryRawUnsafe<Reserva[]>(`SELECT * FROM "ReservaCilindro" WHERE "id" = $1`, id);
  const r = filas[0];
  if (!r) return { ok: false, status: 404, error: 'Reserva no encontrada' };
  if (r.estado !== 'pendiente_pago') return { ok: true, data: r, yaConfirmada: true };

  // Si su día ya cerró (pasadas las 8 PM de ese lote), pasa al listado abierto
  const { dia, hora } = ahoraEnCuba();
  const loteCerrado = r.lote < dia || (r.lote === dia && hora >= HORA_CIERRE);
  const lote = loteCerrado ? loteActual() : r.lote;

  const pin = nuevoPin();
  const act = await db.$queryRawUnsafe<Reserva[]>(
    `UPDATE "ReservaCilindro" SET "estado"='pagada', "pin"=$2, "pagadaEn"=NOW(), "lote"=$3,
       "notas" = CASE WHEN $4::text = '' THEN "notas" ELSE 'Zelle: ' || $4::text END
     WHERE "id"=$1 AND "estado"='pendiente_pago' RETURNING *`,
    id,
    pin,
    lote,
    referencia
  );
  const reserva = act[0];
  if (!reserva) return { ok: false, status: 409, error: 'La reserva cambió; recarga' };

  // Los cilindros pagados salen de la existencia del punto elegido
  if (reserva.puntoId) {
    await descontarBalitasPunto(reserva.puntoId, reserva.cantidad).catch((e) =>
      console.error('[cilindros] No se pudo descontar del punto:', e instanceof Error ? e.message : e)
    );
  }

  // ...y de la existencia de cada producto (la que se ve en la tienda)
  if (reserva.items) {
    await descontarExistencia(itemsDeMetadata(reserva.items)).catch((e) =>
      console.error('[cilindros] No se pudo descontar la existencia:', e instanceof Error ? e.message : e)
    );
  }

  let correo: 'enviado' | 'sin_email' | 'fallo' = 'sin_email';
  if (reserva.emailComprador) {
    try {
      await enviarCorreo({
        to: reserva.emailComprador,
        subject: `Tu pago se registró con éxito — PIN de recogida ${pin} (${reserva.numero})`,
        text: `Tu pago se registró con éxito. PIN de recogida: ${pin}. Reserva ${reserva.numero}: ${reserva.cantidad} cilindro(s). Recoge ${reserva.nombreRecoge} (carnet ${reserva.carnetRecoge}) a partir de ${textoRecogida(reserva.lote)} en ${lugarDe(reserva)}. Debe presentar el carnet y decir el PIN.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111827">
          <h2 style="color:#071a46">¡Tu pago se registró con éxito!</h2>
          <p>Hola ${esc(reserva.nombreComprador)}, recibimos tu pago por Zelle. Tu compra <b>${esc(reserva.numero)}</b> está pagada y este es tu PIN de recogida:</p>
          <p style="font-size:34px;font-weight:800;letter-spacing:8px;background:#071a46;color:#7ed957;text-align:center;padding:18px;border-radius:12px;font-family:monospace">${pin}</p>
          <p><b>${reserva.cantidad}</b> balita(s) de gas.<br>
          Recoge: <b>${esc(reserva.nombreRecoge)}</b> · Carnet ${esc(reserva.carnetRecoge)}<br>
          Puede recogerla <b>a partir de ${esc(textoRecogida(reserva.lote))}</b><br>
          Lugar: <b>${esc(lugarDe(reserva))}</b></p>
          <p style="color:#6b7280;font-size:13px">Al llegar, presenta el carnet de identidad y di este PIN.</p>
        </div>`,
      });
      correo = 'enviado';
    } catch (e) {
      console.error('[cilindros] No se pudo enviar el PIN por correo:', e instanceof Error ? e.message : e);
      correo = 'fallo';
    }
  }

  // Aviso a ventas: cada pago confirmado (es lo único que descuenta inventario)
  const monto = `$${Number(reserva.montoUsd).toFixed(2)}`;
  try {
    await enviarCorreo({
      to: ZELLE_DESTINO,
      subject: `Pago confirmado ${reserva.numero} · ${monto} · ${reserva.cantidad} balita(s)`,
      text: `Pago confirmado ${reserva.numero} por ${monto}. ${reserva.cantidad} balita(s) descontada(s) del inventario. Comprador: ${reserva.nombreComprador}. Recoge: ${reserva.nombreRecoge} (carnet ${reserva.carnetRecoge}) en ${lugarDe(reserva)} a partir de ${textoRecogida(reserva.lote)}. PIN ${pin}.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;color:#111827">
        <h2 style="color:#071a46">Pago confirmado ${esc(reserva.numero)}</h2>
        <p>Entró el Zelle de <b>${monto}</b>. Se descontaron <b>${reserva.cantidad}</b> balita(s) del inventario.</p>
        <p>Comprador: <b>${esc(reserva.nombreComprador)}</b><br>
        Recoge: <b>${esc(reserva.nombreRecoge)}</b> · Carnet ${esc(reserva.carnetRecoge)} · PIN <b>${pin}</b><br>
        Lugar: ${esc(lugarDe(reserva))}<br>
        Desde: ${esc(textoRecogida(reserva.lote))}</p>
      </div>`,
    });
  } catch (e) {
    console.error('[cilindros] No se pudo avisar a ventas del pago:', e instanceof Error ? e.message : e);
  }

  return { ok: true, data: reserva, correo, movidaAlLote: loteCerrado ? lote : null };
}
