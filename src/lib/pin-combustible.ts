import { db } from '@/lib/db';
import { asegurarTablaSolicitudes } from '@/lib/asegurar-tabla-cupet';
import { cupetPost } from '@/lib/cupet-proxy';
import { enviarCorreo } from '@/lib/mailer';

// ═══════════════════════════════════════════════════════════════
// Confirmar el pago de una solicitud de combustible y entregar el PIN.
// Lo usan el botón "Confirmar pago" del panel y el aviso automático de Zelle.
// ═══════════════════════════════════════════════════════════════

type Solicitud = NonNullable<Awaited<ReturnType<typeof db.solicitudCombustible.findUnique>>>;

export type ResultadoConfirmar =
  | { ok: true; data: Solicitud; yaPagada?: boolean }
  | { ok: false; status: number; error: string; detalle?: string; code?: unknown };

export async function confirmarSolicitudCombustible(id: number): Promise<ResultadoConfirmar> {
  await asegurarTablaSolicitudes();
  const sol = await db.solicitudCombustible.findUnique({ where: { id } });
  if (!sol) return { ok: false, status: 404, error: 'Solicitud no encontrada' };
  if (sol.estado === 'pagada') return { ok: true, data: sol, yaPagada: true };
  if (sol.estado === 'anulada') return { ok: false, status: 400, error: 'Solicitud anulada' };

  // Tomar la solicitud para que dos confirmaciones a la vez (panel + Zelle)
  // no registren dos órdenes en CUPET
  const tomada = await db.solicitudCombustible.updateMany({
    where: { id, estado: 'pendiente_pago' },
    data: { estado: 'procesando' },
  });
  if (tomada.count === 0) return { ok: false, status: 409, error: 'La solicitud ya se está procesando' };

  try {
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
      const data = await db.solicitudCombustible.update({
        where: { id },
        data: {
          estado: 'pagada',
          cupetExternalId: json.externalId,
          cupetTransactionId: json.data.transactionId,
          pin: json.data.pin,
          expiracionPin: json.data.expirationDate ? new Date(json.data.expirationDate) : null,
        },
      });
      return { ok: true, data };
    }
    await db.solicitudCombustible.update({ where: { id }, data: { estado: 'pendiente_pago' } });
    return {
      ok: false,
      status: 502,
      error: 'CUPET rechazó la orden',
      detalle: json.data?.errors?.[0] || json.data?.message || json.error || 'Sin detalle',
      code: json.data?.code,
    };
  } catch (e) {
    await db.solicitudCombustible.update({ where: { id }, data: { estado: 'pendiente_pago' } }).catch(() => {});
    throw e;
  }
}

const esc = (t: unknown) =>
  String(t ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Envía el PIN al email del comprador. Lanza error si no hay email o falla el SMTP. */
export async function enviarPinCombustible(sol: Solicitud): Promise<string> {
  if (!sol.pin) throw new Error('Esta solicitud no tiene PIN generado');
  if (!sol.emailComprador) throw new Error('El cliente no dejó email — mándale el PIN por WhatsApp manualmente');

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
        <div style="background: #071a46; border-radius: 16px; padding: 30px; text-align: center; color: white;">
          <h1 style="font-size: 22px; margin: 0;">AMBITOSMAX</h1>
          <p style="color: #7ed957; font-weight: bold; font-size: 14px; margin-top: 4px;">COMBUSTIBLE EN CUBA</p>
        </div>
        <div style="background: white; border-radius: 16px; padding: 30px; margin-top: 16px;">
          <h2 style="color: #071a46; font-size: 18px; margin-bottom: 8px;">¡Tu PIN está listo!</h2>
          <p style="color: #666; font-size: 14px;">Hola ${esc(sol.nombreComprador)},</p>
          <p style="color: #666; font-size: 14px;">Tu solicitud <strong>${esc(sol.numero)}</strong> ha sido confirmada. Aquí están los datos para cargar combustible:</p>

          <div style="background: #071a46; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
            <p style="color: rgba(255,255,255,0.5); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">PIN DE CARGA</p>
            <p style="color: #7ed957; font-size: 36px; font-weight: 900; font-family: monospace; letter-spacing: 6px; margin: 0;">${esc(sol.pin)}</p>
          </div>

          <table style="width: 100%; font-size: 14px; color: #333; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Orden:</td><td style="text-align: right;">#${sol.cupetTransactionId}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Combustible:</td><td style="text-align: right;">${esc(sol.typeFuelNombre)}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Cantidad:</td><td style="text-align: right;">${sol.litros} litros</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Estación:</td><td style="text-align: right;">${esc(sol.servicenterNombre)}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Beneficiario:</td><td style="text-align: right;">${esc(sol.nombreBeneficiario)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Válido hasta:</td><td style="text-align: right;">${sol.expiracionPin ? new Date(sol.expiracionPin).toLocaleDateString('es-ES') : 'Consultar'}</td></tr>
          </table>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin-top: 20px;">
            <p style="font-size: 13px; color: #166534; margin: 0;"><strong>Instrucciones:</strong> El beneficiario debe ir a la gasolinera indicada, presentar su carnet de identidad y este PIN en el surtidor para cargar el combustible.</p>
          </div>
        </div>
        <div style="text-align: center; padding: 16px; font-size: 12px; color: #999;">
          AMBITOSMAX · <a href="https://ambitosmax.com" style="color: #123d83;">ambitosmax.com</a>
        </div>
      </div>
    `;

  await enviarCorreo({
    to: sol.emailComprador,
    subject: `PIN de carga: ${sol.pin} — ${sol.litros} litros de ${sol.typeFuelNombre}`,
    text: `Tu PIN: ${sol.pin}. ${sol.litros} litros de ${sol.typeFuelNombre} en ${sol.servicenterNombre}. Orden #${sol.cupetTransactionId}. Válido hasta ${sol.expiracionPin || 'consultar'}.`,
    html,
  });
  return sol.emailComprador;
}
