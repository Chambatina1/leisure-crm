import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cupetPost } from '@/lib/cupet-proxy';

// ═══════════════════════════════════════════════════════════════
// POST /api/cupet/solicitud/[id]/confirmar  (admin)
// El operador confirma el pago por Zelle → se registra la orden en
// CUPET → PIN generado → queda guardado en la solicitud.
// ═══════════════════════════════════════════════════════════════

const CLAVE_ADMIN = process.env.ADMIN_PASSWORD || 'leisure-exporting2024'; // fase 1

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (request.headers.get('x-admin-password') !== CLAVE_ADMIN) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }
    const { id } = await params;
    const sol = await db.solicitudCombustible.findUnique({ where: { id: parseInt(id, 10) } });
    if (!sol) return NextResponse.json({ ok: false, error: 'Solicitud no encontrada' }, { status: 404 });
    if (sol.estado === 'pagada') {
      return NextResponse.json({ ok: true, data: sol, yaPagada: true });
    }
    if (sol.estado === 'anulada') {
      return NextResponse.json({ ok: false, error: 'Solicitud anulada' }, { status: 400 });
    }

    // Registrar la orden en CUPET (por el túnel)
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
      const actualizada = await db.solicitudCombustible.update({
        where: { id: sol.id },
        data: {
          estado: 'pagada',
          cupetExternalId: json.externalId,
          cupetTransactionId: json.data.transactionId,
          pin: json.data.pin,
          expiracionPin: json.data.expirationDate ? new Date(json.data.expirationDate) : null,
        },
      });
      return NextResponse.json({ ok: true, data: actualizada });
    }

    // CUPET rechazó la orden — la solicitud queda pendiente con el motivo
    return NextResponse.json(
      {
        ok: false,
        error: 'CUPET rechazó la orden',
        detalle: json.data?.errors?.[0] || json.data?.message || json.error || 'Sin detalle',
        code: json.data?.code,
      },
      { status: 502 }
    );
  } catch (e) {
    console.error('[cupet] Error:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
