import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { asegurarTablaSolicitudes } from '@/lib/asegurar-tabla-cupet';
import { correoConfigurado } from '@/lib/mailer';
import { enviarPinCombustible } from '@/lib/pin-combustible';

// ═══════════════════════════════════════════════════════════════
// POST /api/cupet/enviar-pin — Envía el PIN por email
// ═══════════════════════════════════════════════════════════════

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
    if (!sol.emailComprador) {
      return NextResponse.json(
        { ok: false, error: 'El cliente no dejó email — mándale el PIN por WhatsApp manualmente' },
        { status: 400 }
      );
    }
    if (!(await correoConfigurado())) {
      return NextResponse.json(
        { ok: false, error: 'SMTP no configurado. Agrega SMTP_HOST, SMTP_USER y SMTP_PASS en Render → Environment' },
        { status: 503 }
      );
    }

    const destino = await enviarPinCombustible(sol);
    return NextResponse.json({ ok: true, mensaje: `PIN enviado a ${destino}` });
  } catch (e) {
    console.error('[enviar-pin] Error:', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message.slice(0, 200) : 'Error enviando email' },
      { status: 500 }
    );
  }
}
