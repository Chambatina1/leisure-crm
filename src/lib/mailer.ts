// Envío de correo compartido. Toma SMTP de las variables de entorno
// (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM) y, si faltan,
// de la tabla Config (claves SMTP_*), igual que el resto del proyecto.
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';

async function smtpDesdeConfig(): Promise<Record<string, string>> {
  try {
    const rows = await db.config.findMany({
      where: { clave: { in: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'] } },
    });
    return Object.fromEntries(rows.map((r) => [r.clave, r.valor]));
  } catch {
    return {};
  }
}

export async function correoConfigurado(): Promise<boolean> {
  const c = await smtpDesdeConfig();
  const host = process.env.SMTP_HOST || c.SMTP_HOST;
  const user = process.env.SMTP_USER || c.SMTP_USER;
  const pass = process.env.SMTP_PASS || c.SMTP_PASS;
  return Boolean(host && user && pass);
}

export async function enviarCorreo(opts: { to: string; subject: string; html: string; text: string }) {
  const c = await smtpDesdeConfig();
  const host = process.env.SMTP_HOST || c.SMTP_HOST || '';
  const port = parseInt(process.env.SMTP_PORT || c.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || c.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || c.SMTP_PASS || '';
  const from = process.env.EMAIL_FROM || c.EMAIL_FROM || user;

  if (!host || !user || !pass) {
    throw new Error('SMTP_NO_CONFIGURADO');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: from.includes('<') ? from : `"Ambitosmax" <${from}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}
