import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import { asegurarTablaSolicitudes } from '@/lib/asegurar-tabla-cupet';

// ═══════════════════════════════════════════════════════════════
// POST /api/cupet/enviar-pin — Envía el PIN por email automáticamente
// ═══════════════════════════════════════════════════════════════


const esc = (t: unknown) =>
  String(t ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }
    await asegurarTablaSolicitudes();

    const { solicitudId } = await request.json();
    const sol = await db.solicitudCombustible.findUnique({
      where: { id: parseInt(solicitudId, 10) },
    });
    if (!sol) return NextResponse.json({ ok: false, error: 'Solicitud no encontrada' }, { status: 404 });
    if (!sol.pin) return NextResponse.json({ ok: false, error: 'Esta solicitud no tiene PIN generado' }, { status: 400 });

    // Determinar el email del destinatario
    const emailDestino = sol.emailComprador;
    if (!emailDestino) {
      return NextResponse.json(
        { ok: false, error: 'El cliente no dejó email — mándale el PIN por WhatsApp manualmente' },
        { status: 400 }
      );
    }

    // Configurar SMTP (desde variables de entorno)
    const host = process.env.SMTP_HOST || '';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    if (!host || !user || !pass) {
      return NextResponse.json(
        { ok: false, error: 'SMTP no configurado. Agrega SMTP_HOST, SMTP_USER y SMTP_PASS en Render → Environment' },
        { status: 503 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

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
          AMBITOSMAX · Miami, FL · <a href="https://ambitosmax.com" style="color: #123d83;">ambitosmax.com</a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"AMBITOSMAX" <${user}>`,
      to: emailDestino,
      subject: `PIN de carga: ${sol.pin} — ${sol.litros} litros de ${sol.typeFuelNombre}`,
      text: `Tu PIN: ${sol.pin}. ${sol.litros} litros de ${sol.typeFuelNombre} en ${sol.servicenterNombre}. Orden #${sol.cupetTransactionId}. Válido hasta ${sol.expiracionPin || 'consultar'}.`,
      html,
    });

    return NextResponse.json({ ok: true, mensaje: `PIN enviado a ${emailDestino}` });
  } catch (e) {
    console.error('[enviar-pin] Error:', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message.slice(0, 200) : 'Error enviando email' },
      { status: 500 }
    );
  }
}
