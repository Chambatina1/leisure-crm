import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import nodemailer from 'nodemailer';

// ─── Validación ────────────────────────────────────────────────────────
const emailSchema = z.object({
  to: z.string().email('Email destinatario inválido'),
  subject: z.string().min(1, 'El asunto es requerido'),
  html: z.string().min(1, 'El contenido HTML es requerido'),
  tipo: z.string().optional().default('general'),
});

// ─── Obtener configuración SMTP desde Config table ─────────────────────
async function getSmtpConfig() {
  try {
    const keys = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'EMAIL_FROM',
    ];
    const entries = await db.config.findMany({
      where: { clave: { in: keys } },
    });
    const config: Record<string, string> = {};
    for (const entry of entries) {
      config[entry.clave] = entry.valor;
    }
    return config;
  } catch {
    return {};
  }
}

// ─── Crear transporter de nodemailer ────────────────────────────────────
async function createTransporter() {
  // Prioridad: Config table > Environment variables
  const dbConfig = await getSmtpConfig();

  const host = dbConfig.SMTP_HOST || process.env.SMTP_HOST || '';
  const port = parseInt(
    dbConfig.SMTP_PORT || process.env.SMTP_PORT || '587',
    10
  );
  const user = dbConfig.SMTP_USER || process.env.SMTP_USER || '';
  const pass = dbConfig.SMTP_PASS || process.env.SMTP_PASS || '';

  if (!host || !user || !pass) {
    return null; // SMTP no configurado
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

// ─── POST /api/email/send ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = emailSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { ok: false, error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { to, subject, html, tipo } = validated.data;

    const transporter = await createTransporter();
    const emailFrom =
      process.env.EMAIL_FROM ||
      (await (async () => {
        const cfg = await getSmtpConfig();
        return cfg.EMAIL_FROM || '';
      })());

    let messageId: string | undefined;
    let estado = 'enviado' as const;
    let errorMsg: string | null = null;
    let warning: string | null = null;

    if (transporter && emailFrom) {
      // ── Enviar correo real ─────────────────────────────────────────
      try {
        const info = await transporter.sendMail({
          from: emailFrom,
          to,
          subject,
          html,
        });
        messageId = info.messageId;
        console.log(`[Email] Correo enviado a ${to} (${tipo}) - ${messageId}`);
      } catch (sendErr) {
        const msg =
          sendErr instanceof Error ? sendErr.message : 'Error desconocido';
        console.error(`[Email] Error al enviar correo a ${to}:`, msg);
        estado = 'fallido';
        errorMsg = msg;

        // Log pero no fallar la petición
        return NextResponse.json(
          { ok: false, error: `Error al enviar correo: ${msg}` },
          { status: 500 }
        );
      }
    } else {
      // ── SMTP no configurado — log del correo ───────────────────────
      console.log('╔══════════════════════════════════════════════════╗');
      console.log('║  ⚠️  SMTP NO CONFIGURADO — Log de correo        ║');
      console.log('╠══════════════════════════════════════════════════╣');
      console.log(`║  Para:   ${to}`);
      console.log(`║  Asunto: ${subject}`);
      console.log(`║  Tipo:   ${tipo}`);
      console.log(`║  HTML:   ${html.substring(0, 200)}...`);
      console.log('╚══════════════════════════════════════════════════╝');
      estado = 'enviado';
      warning = 'SMTP no configurado. El correo fue registrado pero no enviado.';
    }

    // ── Guardar log en EmailLog ──────────────────────────────────────
    try {
      await db.emailLog.create({
        data: {
          userEmail: to,
          asunto: subject,
          tipo,
          estado,
          error: errorMsg,
        },
      });
    } catch (logErr) {
      console.error('[Email] Error al guardar log del correo:', logErr);
    }

    const response: Record<string, unknown> = {
      ok: true,
      data: {
        estado,
        tipo,
        to,
      },
    };

    if (messageId) {
      response.data.messageId = messageId;
    }
    if (warning) {
      response.warning = warning;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Email] Error general:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al procesar el envío de correo' },
      { status: 500 }
    );
  }
}
