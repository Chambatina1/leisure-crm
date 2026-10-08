import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { clientIp } from '@/lib/admin-auth';
import { enviarCorreo } from '@/lib/mailer';
import { crearCodigo, limiteIp } from '@/lib/verificacion-email';

// POST /api/users/login/codigo { email } — envía un código para entrar (sin contraseña)
const schema = z.object({ email: z.string().trim().toLowerCase().email().max(150) });

export async function POST(request: NextRequest) {
  try {
    if (!limiteIp(`login:${clientIp(request)}`, 8, 15 * 60 * 1000)) {
      return NextResponse.json({ ok: false, error: 'Demasiadas solicitudes. Espera unos minutos.' }, { status: 429 });
    }
    const p = schema.safeParse(await request.json());
    if (!p.success) return NextResponse.json({ ok: false, error: 'Correo inválido' }, { status: 400 });
    const { email } = p.data;

    const user = await db.user.findUnique({ where: { email }, select: { nombre: true, isActive: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: 'No hay ninguna cuenta con ese correo. Regístrate primero.', noExiste: true }, { status: 404 });
    }
    if (!user.isActive) {
      return NextResponse.json({ ok: false, error: 'Esta cuenta está desactivada. Contáctanos.' }, { status: 403 });
    }

    const r = await crearCodigo(email);
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error, esperaSegundos: r.esperaSegundos }, { status: 429 });

    try {
      await enviarCorreo({
        to: email,
        subject: `Tu código para entrar: ${r.codigo}`,
        text: `Tu código para entrar en Ambitosmax es ${r.codigo}. Caduca en 10 minutos.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">
          <h2 style="color:#071a46;margin:0 0 12px">Entrar en Ambitosmax</h2>
          <p>Usa este código para iniciar sesión:</p>
          <p style="font-size:34px;font-weight:800;letter-spacing:8px;background:#071a46;color:#7ed957;text-align:center;padding:18px;border-radius:12px;font-family:monospace">${r.codigo}</p>
          <p style="color:#6b7280;font-size:13px">Caduca en 10 minutos. Si no fuiste tú, ignora este correo.</p></div>`,
      });
    } catch (e) {
      console.error('[Login] No se pudo enviar el código:', e instanceof Error ? e.message : e);
      return NextResponse.json({ ok: false, error: 'No pudimos enviar el código ahora. Inténtalo más tarde.' }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[Login] Error:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
