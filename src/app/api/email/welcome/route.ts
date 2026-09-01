import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import nodemailer from 'nodemailer';

// ─── Validación ────────────────────────────────────────────────────────
const welcomeSchema = z.object({
  user: z.object({
    nombre: z.string().min(2),
    email: z.string().email(),
    telefono: z.string().optional().or(z.literal('')),
  }),
});

// ─── Obtener configuración desde la tabla Config ───────────────────────
async function getPlatformConfig() {
  const keys = [
    'direccion',
    'telefono1',
    'nombre_contacto1',
    'telefono2',
    'nombre_contacto2',
    'telefono3',
    'nombre_contacto3',
    'horario',
    'email',
    'whatsapp',
    'instagram',
    'facebook',
  ];

  const defaults: Record<string, string> = {
    direccion: '7523 Aloma Ave, Winter Park, FL 32792, Suite 112',
    telefono1: '786-942-6904',
    nombre_contacto1: 'Geo',
    telefono2: '786-784-6421',
    nombre_contacto2: 'Adriana',
    horario: 'Lunes a Viernes 9:00 AM - 6:00 PM',
    email: '',
    whatsapp: '',
    instagram: '',
    facebook: '',
  };

  try {
    const entries = await db.config.findMany({
      where: { clave: { in: keys } },
    });
    const result: Record<string, string> = {};
    for (const k of keys) {
      const entry = entries.find((e) => e.clave === k);
      result[k] = entry?.valor || defaults[k] || '';
    }
    return result;
  } catch {
    return defaults;
  }
}

// ─── Generar HTML del correo de bienvenida ─────────────────────────────
function buildWelcomeHtml(
  nombre: string,
  config: Record<string, string>
): string {
  const telefonos: string[] = [];
  if (config.telefono1)
    telefonos.push(
      `<li style="margin:0 0 6px 0;font-size:14px;">📞 <strong>${config.nombre_contacto1 || 'Teléfono 1'}:</strong>&nbsp;<a href="tel:${config.telefono1}" style="color:#D97706;text-decoration:none;">${config.telefono1}</a></li>`
    );
  if (config.telefono2)
    telefonos.push(
      `<li style="margin:0 0 6px 0;font-size:14px;">📞 <strong>${config.nombre_contacto2 || 'Teléfono 2'}:</strong>&nbsp;<a href="tel:${config.telefono2}" style="color:#D97706;text-decoration:none;">${config.telefono2}</a></li>`
    );
  if (config.telefono3)
    telefonos.push(
      `<li style="margin:0 0 6px 0;font-size:14px;">📞 <strong>${config.nombre_contacto3 || 'Teléfono 3'}:</strong>&nbsp;<a href="tel:${config.telefono3}" style="color:#D97706;text-decoration:none;">${config.telefono3}</a></li>`
    );

  const redes: string[] = [];
  if (config.whatsapp)
    redes.push(
      `<a href="${config.whatsapp}" style="display:inline-block;margin-right:12px;background:#25D366;color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">💬 WhatsApp</a>`
    );
  if (config.instagram)
    redes.push(
      `<a href="${config.instagram}" style="display:inline-block;margin-right:12px;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">📸 Instagram</a>`
    );
  if (config.facebook)
    redes.push(
      `<a href="${config.facebook}" style="display:inline-block;margin-right:12px;background:#1877F2;color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">📘 Facebook</a>`
    );

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a Leisure Exporting</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:#F9FAFB;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ¡Bienvenido a Leisure Exporting! Tu plataforma de envíos internacionales, rastreo de paquetes y mucho más.
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F9FAFB;">
    <tr>
      <td align="center" style="padding:24px 16px;">

        <!-- Main card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- ── Header Banner ────────────────────────────────────── -->
          <tr>
            <td style="background:linear-gradient(135deg,#F59E0B 0%,#D97706 40%,#B45309 100%);padding:40px 32px;text-align:center;">
              <!-- Logo placeholder -->
              <div style="width:72px;height:72px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="font-size:36px;">📦</span>
              </div>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">
                ¡Bienvenido a Leisure Exporting!
              </h1>
              <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.9);font-weight:400;">
                Tu puente hacia envíos internacionales confiables
              </p>
            </td>
          </tr>

          <!-- ── Body ─────────────────────────────────────────────── -->
          <tr>
            <td style="padding:36px 32px 28px;">

              <!-- Greeting -->
              <p style="margin:0 0 20px;font-size:17px;color:#1F2937;line-height:1.6;">
                ¡Hola <strong style="color:#D97706;">${nombre}</strong>! 🎉
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#4B5563;line-height:1.7;">
                Gracias por registrarte en <strong>Leisure Exporting</strong>, tu plataforma integral para
                envíos internacionales desde Estados Unidos. Estamos encantados de tenerte con nosotros
                y estamos listos para ayudarte con todos tus envíos.
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #F3F4F6;margin:24px 0;" />

              <!-- ── Services Section ──────────────────────────────── -->
              <h2 style="margin:0 0 16px;font-size:18px;color:#111827;font-weight:700;">
                🌟 Nuestros Servicios
              </h2>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
                <!-- Service 1 -->
                <tr>
                  <td style="padding:14px 16px;background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border-radius:10px;margin-bottom:8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="44" valign="top">
                          <div style="width:40px;height:40px;background:#F59E0B;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">📦</div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#92400E;">Envíos Internacionales</p>
                          <p style="margin:0;font-size:13px;color:#78716C;line-height:1.5;">Desde $1.80/lb · Equipo, recogida a domicilio y compras TikTok</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Service 2 -->
                <tr>
                  <td style="padding:14px 16px;background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border-radius:10px;margin-top:8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="44" valign="top">
                          <div style="width:40px;height:40px;background:#10B981;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">🚲</div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#065F46;">Envío de Bicicletas</p>
                          <p style="margin:0;font-size:13px;color:#78716C;line-height:1.5;">Infantiles, adultas y eléctricas · Armadas o desarmadas</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Service 3 -->
                <tr>
                  <td style="padding:14px 16px;background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border-radius:10px;margin-top:8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="44" valign="top">
                          <div style="width:40px;height:40px;background:#3B82F6;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">📋</div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#1E3A5F;">Rastreo de Paquetes</p>
                          <p style="margin:0;font-size:13px;color:#78716C;line-height:1.5;">Sigue tus envíos en tiempo real con número CPK o carnet</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Service 4 -->
                <tr>
                  <td style="padding:14px 16px;background:linear-gradient(135deg,#FDF4FF,#FAE8FF);border-radius:10px;margin-top:8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="44" valign="top">
                          <div style="width:40px;height:40px;background:#A855F7;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">☀️</div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#581C87;">Sistemas Solares</p>
                          <p style="margin:0;font-size:13px;color:#78716C;line-height:1.5;">Orientación y productos EcoFlow para energía solar</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #F3F4F6;margin:24px 0;" />

              <!-- ── Platform Features ─────────────────────────────── -->
              <h2 style="margin:0 0 16px;font-size:18px;color:#111827;font-weight:700;">
                🚀 Descubre nuestra Plataforma
              </h2>
              <p style="margin:0 0 20px;font-size:14px;color:#6B7280;line-height:1.6;">
                Desde tu cuenta puedes acceder a todas estas funcionalidades:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:10px 0;">
                    <a href="${baseUrl}/rastreador" style="display:block;padding:14px 20px;background:#FFF7ED;border:2px solid #FDBA74;border-radius:10px;text-decoration:none;transition:all 0.2s;">
                      <span style="font-size:18px;margin-right:8px;">🔍</span>
                      <span style="font-size:15px;font-weight:600;color:#9A3412;">Rastreador de Paquetes</span>
                      <br/>
                      <span style="font-size:12px;color:#B45309;">Sigue tus envíos en tiempo real</span>
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <a href="${baseUrl}/tienda" style="display:block;padding:14px 20px;background:#F0FDF4;border:2px solid #86EFAC;border-radius:10px;text-decoration:none;transition:all 0.2s;">
                      <span style="font-size:18px;margin-right:8px;">🛍️</span>
                      <span style="font-size:15px;font-weight:600;color:#166534;">Tienda</span>
                      <br/>
                      <span style="font-size:12px;color:#15803D;">Explora nuestros productos y servicios</span>
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <a href="${baseUrl}/chat" style="display:block;padding:14px 20px;background:#FDF4FF;border:2px solid #D8B4FE;border-radius:10px;text-decoration:none;transition:all 0.2s;">
                      <span style="font-size:18px;margin-right:8px;">🤖</span>
                      <span style="font-size:15px;font-weight:600;color:#6B21A8;">Chat Inteligente</span>
                      <br/>
                      <span style="font-size:12px;color:#7E22CE;">Asistente virtual para resolver tus dudas</span>
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #F3F4F6;margin:24px 0;" />

              <!-- ── Contact Info ──────────────────────────────────── -->
              <h2 style="margin:0 0 16px;font-size:18px;color:#111827;font-weight:700;">
                📍 Información de Contacto
              </h2>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                <tr>
                  <td style="padding:16px 20px;background:#F9FAFB;border-radius:10px;border-left:4px solid #F59E0B;">
                    <p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.5;">
                      🏢 <strong>Oficina:</strong> ${config.direccion}
                    </p>
                    <p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.5;">
                      ⏰ <strong>Horario:</strong> ${config.horario}
                    </p>
                    <ul style="margin:8px 0 0;padding-left:20px;color:#374151;">
                      ${telefonos.join('\n                      ')}
                    </ul>
                    ${
                      config.email
                        ? `<p style="margin:8px 0 0;font-size:14px;color:#374151;">📧 <strong>Email:</strong>&nbsp;<a href="mailto:${config.email}" style="color:#D97706;text-decoration:none;">${config.email}</a></p>`
                        : ''
                    }
                  </td>
                </tr>
              </table>

              ${
                redes.length > 0
                  ? `
              <!-- Social links -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:16px 20px;background:#F9FAFB;border-radius:10px;text-align:center;">
                    <p style="margin:0 0 12px;font-size:13px;color:#6B7280;font-weight:600;">¡Síguenos en redes!</p>
                    ${redes.join('\n                    ')}
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #F3F4F6;margin:24px 0;" />

              <!-- ── CTA ───────────────────────────────────────────── -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="text-align:center;padding:8px 0;">
                    <a href="${baseUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#F59E0B,#D97706);color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                      Comenzar Ahora →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- ── Closing ────────────────────────────────────────── -->
              <p style="margin:24px 0 0;font-size:14px;color:#6B7280;line-height:1.7;text-align:center;">
                Si tienes alguna pregunta, no dudes en contactarnos. Estamos aquí para ayudarte.
              </p>
              <p style="margin:16px 0 0;font-size:14px;color:#374151;line-height:1.7;text-align:center;">
                Un saludo afectuoso,<br/>
                <strong style="color:#D97706;font-size:15px;">El equipo de Leisure Exporting</strong> 🤝
              </p>

            </td>
          </tr>

          <!-- ── Footer ────────────────────────────────────────────── -->
          <tr>
            <td style="background:#1F2937;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#9CA3AF;">
                © ${new Date().getFullYear()} Leisure Exporting. Todos los derechos reservados.
              </p>
              <p style="margin:0;font-size:12px;color:#6B7280;">
                Este correo fue enviado a <span style="color:#D97706;">(registrado)</span> porque te registraste en nuestra plataforma.
              </p>
            </td>
          </tr>

        </table>
        <!-- End main card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Obtener configuración SMTP ─────────────────────────────────────────
async function getSmtpFromEnv(): Promise<Record<string, string>> {
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

// ─── POST /api/email/welcome ───────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = welcomeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { ok: false, error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { user } = validated.data;
    const { nombre, email } = user;

    // ── Obtener config de la plataforma ─────────────────────────────
    const config = await getPlatformConfig();
    const html = buildWelcomeHtml(nombre, config);

    // ── Enviar correo ───────────────────────────────────────────────
    const smtpConfig = await getSmtpFromEnv();
    const host = smtpConfig.SMTP_HOST || process.env.SMTP_HOST || '';
    const port = parseInt(
      smtpConfig.SMTP_PORT || process.env.SMTP_PORT || '587',
      10
    );
    const smtpUser = smtpConfig.SMTP_USER || process.env.SMTP_USER || '';
    const smtpPass = smtpConfig.SMTP_PASS || process.env.SMTP_PASS || '';
    const emailFrom =
      smtpConfig.EMAIL_FROM || process.env.EMAIL_FROM || '';

    let messageId: string | undefined;
    let estado = 'enviado' as const;
    let errorMsg: string | null = null;
    let warning: string | null = null;

    if (host && smtpUser && smtpPass && emailFrom) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });

        const info = await transporter.sendMail({
          from: `"Leisure Exporting" <${emailFrom}>`,
          to: email,
          subject: `¡Bienvenido a Leisure Exporting, ${nombre}! 📦`,
          html,
        });

        messageId = info.messageId;
        console.log(
          `[Welcome] Correo de bienvenida enviado a ${email} - ${messageId}`
        );
      } catch (sendErr) {
        const msg =
          sendErr instanceof Error ? sendErr.message : 'Error desconocido';
        console.error(
          `[Welcome] Error al enviar correo de bienvenida a ${email}:`,
          msg
        );
        estado = 'fallido';
        errorMsg = msg;
      }
    } else {
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║  ⚠️  SMTP NO CONFIGURADO — Log de correo de bienvenida  ║');
      console.log('╠════════════════════════════════════════════════════════╣');
      console.log(`║  Para:   ${email}`);
      console.log(`║  Nombre: ${nombre}`);
      console.log('╚════════════════════════════════════════════════════════╝');
      warning =
        'SMTP no configurado. El correo de bienvenida fue registrado pero no enviado.';
    }

    // ── Guardar log ─────────────────────────────────────────────────
    try {
      await db.emailLog.create({
        data: {
          userEmail: email,
          asunto: `¡Bienvenido a Leisure Exporting, ${nombre}!`,
          tipo: 'bienvenida',
          estado,
          error: errorMsg,
        },
      });
    } catch (logErr) {
      console.error(
        '[Welcome] Error al guardar log del correo de bienvenida:',
        logErr
      );
    }

    const response: Record<string, unknown> = {
      ok: true,
      data: {
        estado,
        tipo: 'bienvenida',
        to: email,
      },
    };

    if (messageId) response.data.messageId = messageId;
    if (warning) response.warning = warning;

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Welcome] Error al enviar correo de bienvenida:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al enviar correo de bienvenida' },
      { status: 500 }
    );
  }
}
