import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { enviarCorreo } from '@/lib/mailer';

const ESTADOS_VALIDOS = ['pendiente', 'pendiente_pago', 'pagado', 'en_proceso', 'en_transito', 'en_aduana', 'entregado', 'cancelado'];

const esc = (t: unknown) =>
  String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// PATCH /api/pedidos/[id]/estado - Update pedido status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    const { estado } = body;

    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json(
        { ok: false, error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}` },
        { status: 400 }
      );
    }

    const pedidoId = parseInt(id, 10);
    // Pasar de "Esperando pago" a "Pagado" avisa al cliente por correo (una sola vez)
    const confirmaPago =
      estado === 'pagado' &&
      (await db.pedido.updateMany({ where: { id: pedidoId, estado: 'pendiente_pago' }, data: { estado } })).count === 1;
    const pedido = confirmaPago
      ? await db.pedido.findUniqueOrThrow({ where: { id: pedidoId } })
      : await db.pedido.update({ where: { id: pedidoId }, data: { estado } });

    let correo: 'enviado' | 'sin_email' | 'fallo' | undefined;
    if (confirmaPago) {
      correo = 'sin_email';
      if (pedido.emailComprador) {
        try {
          await enviarCorreo({
            to: pedido.emailComprador,
            subject: `Tu pago se registró con éxito — Pedido ${pedido.id}`,
            text: `Hola ${pedido.nombreComprador}, recibimos tu pago por Zelle y tu pedido ${pedido.id} quedó confirmado: ${pedido.producto}. Te avisaremos cuando avance. AMBITOSMAX`,
            html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111827">
              <h2 style="color:#071a46">¡Tu pago se registró con éxito!</h2>
              <p>Hola ${esc(pedido.nombreComprador)}, recibimos tu pago por Zelle y tu <b>pedido ${pedido.id}</b> quedó confirmado.</p>
              <p style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px">${esc(pedido.producto)}</p>
              <p>Destinatario: <b>${esc(pedido.nombreDestinatario)}</b></p>
              <p style="color:#6b7280;font-size:13px">Te avisaremos cuando tu pedido avance. Gracias por comprar en AMBITOSMAX.</p>
            </div>`,
          });
          correo = 'enviado';
        } catch (e) {
          correo = 'fallo';
          console.error('[pedidos] No se pudo enviar el correo de pago:', e instanceof Error ? e.message : e);
        }
      }
    }

    return NextResponse.json({ ok: true, data: pedido, ...(correo ? { correo } : {}) });
  } catch (error) {
    console.error('Error updating estado:', error);
    return NextResponse.json({ ok: false, error: 'Error al actualizar estado' }, { status: 500 });
  }
}
