import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { clientIp } from '@/lib/admin-auth';
import { enviarCorreo } from '@/lib/mailer';
import { crearCodigo, esCorreoDesechable, limiteIp } from '@/lib/verificacion-email';

// POST /api/users/register/codigo — paso 1 del registro: envía un código al correo
const schema = z.object({
  nombre: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email('Email inválido').max(150),
  website: z.string().optional(), // trampa anti-bots (campo oculto)
  t: z.number().optional(),       // momento en que se abrió el formulario
});

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    if (!limiteIp(`codigo:${ip}`, 8, 15 * 60 * 1000)) {
      return NextResponse.json(
        { ok: false, error: 'Demasiadas solicitudes. Espera unos minutos.' },
        { status: 429 }
      );
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Revisa el nombre y el correo' }, { status: 400 });
    }
    const { nombre, email, website, t } = parsed.data;

    // Bot: rellenó el campo oculto → respondemos "ok" sin hacer nada
    if (website) return NextResponse.json({ ok: true });
    // Bot: envió el formulario en menos de 3 segundos
    if (t && Date.now() - t < 3000) {
      return NextResponse.json({ ok: false, error: 'Inténtalo de nuevo' }, { status: 400 });
    }

    if (esCorreoDesechable(email)) {
      return NextResponse.json(
        { ok: false, error: 'Usa un correo personal, no uno temporal' },
        { status: 400 }
      );
    }

    const existe = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existe) {
      return NextResponse.json(
        { ok: false, error: 'Ya existe una cuenta con ese correo' },
        { status: 409 }
      );
    }

    const r = await crearCodigo(email);
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: r.error, esperaSegundos: r.esperaSegundos },
        { status: 429 }
      );
    }

    try {
      await enviarCorreo({
        to: email,
        subject: `Tu código de verificación: ${r.codigo}`,
        text: `Hola ${nombre}, tu código para crear la cuenta en Ambitosmax es ${r.codigo}. Caduca en 10 minutos. Si no lo pediste, ignora este correo.`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">
            <h2 style="color:#071a46;margin:0 0 12px">Verifica tu correo</h2>
            <p>Hola ${esc(nombre)}, usa este código para terminar tu registro en Ambitosmax:</p>
            <p style="font-size:34px;font-weight:800;letter-spacing:8px;background:#071a46;color:#7ed957;text-align:center;padding:18px;border-radius:12px;font-family:monospace">${r.codigo}</p>
            <p style="color:#6b7280;font-size:13px">Caduca en 10 minutos. Si no fuiste tú, ignora este correo.</p>
          </div>`,
      });
    } catch (e) {
      const sinSmtp = e instanceof Error && e.message === 'SMTP_NO_CONFIGURADO';
      console.error('[Registro] No se pudo enviar el código:', sinSmtp ? 'SMTP no configurado' : e);
      return NextResponse.json(
        { ok: false, error: 'No pudimos enviar el código ahora. Inténtalo más tarde.' },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Registro] Error al generar código:', error);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
