import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { enviarCorreo } from '@/lib/mailer';
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

// POST /api/cilindros/[id]/confirmar (admin) — pago recibido → genera PIN
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    await asegurarTablaReservas();
    const id = parseInt((await params).id, 10);
    const body = await request.json().catch(() => ({}));
    const referencia = String(body.referenciaZelle || '').trim().slice(0, 100);
    const filas = await db.$queryRawUnsafe<Reserva[]>(`SELECT * FROM "ReservaCilindro" WHERE "id" = $1`, id);
    const r = filas[0];
    if (!r) return NextResponse.json({ ok: false, error: 'Reserva no encontrada' }, { status: 404 });
    if (r.estado !== 'pendiente_pago') {
      return NextResponse.json({ ok: true, data: r, yaConfirmada: true });
    }

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
    if (!reserva) return NextResponse.json({ ok: false, error: 'La reserva cambió; recarga' }, { status: 409 });

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

    return NextResponse.json({ ok: true, data: reserva, correo, movidaAlLote: loteCerrado ? lote : null });
  } catch (e) {
    console.error('[cilindros] Error al confirmar:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
