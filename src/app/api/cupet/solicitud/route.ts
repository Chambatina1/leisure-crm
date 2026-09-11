import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { asegurarTablaSolicitudes } from '@/lib/asegurar-tabla-cupet';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// /api/cupet/solicitud — Solicitudes de combustible (FASE 1)
//   POST (público): crear solicitud → cliente paga por Zelle
//   GET  (admin):   listar solicitudes pendientes/todas
// ═══════════════════════════════════════════════════════════════

const CLAVE_ADMIN = process.env.ADMIN_PASSWORD || 'ambitosmax2024'; // fase 1
const esAdmin = (r: NextRequest) => r.headers.get('x-admin-password') === CLAVE_ADMIN;

const solicitudSchema = z.object({
  nombreComprador: z.string().min(3).max(100),
  telefonoComprador: z.string().min(5).max(20),
  emailComprador: z.string().email().optional().or(z.literal('')),
  nombreBeneficiario: z.string().min(3).max(100),
  ciBeneficiario: z.string().regex(/^\d{11}$/, 'El carnet debe tener exactamente 11 dígitos'),
  telefonoCuba: z.string().min(5).max(20),
  servicenterId: z.number().int().positive(),
  servicenterNombre: z.string().min(2).max(150),
  typeFuelId: z.number().int().positive(),
  typeFuelNombre: z.string().min(2).max(80),
  litros: z.number().positive().max(5000),
  montoUsd: z.number().positive().max(50000),
});

export async function POST(request: NextRequest) {
  try {
    await asegurarTablaSolicitudes();
    const body = solicitudSchema.parse(await request.json());

    // Número consecutivo SC-000001
    const ultima = await db.solicitudCombustible.findFirst({
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    let num = 1;
    if (ultima?.numero) {
      const n = parseInt(ultima.numero.replace('SC-', ''), 10);
      if (!isNaN(n)) num = n + 1;
    }
    const numero = 'SC-' + String(num).padStart(6, '0');

    const sol = await db.solicitudCombustible.create({
      data: { ...body, emailComprador: body.emailComprador || null, numero },
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          numero: sol.numero,
          montoUsd: sol.montoUsd,
          zelle: '727-598-6802',
          instrucciones:
            'Paga por Zelle al 727-598-6802 el monto exacto y usa la referencia ' +
            numero +
            '. Al confirmar tu pago te enviaremos el PIN de carga.',
        },
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Datos inválidos', detalles: e.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error('[cupet] Error:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await asegurarTablaSolicitudes();
    if (!esAdmin(request)) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }
    const estado = request.nextUrl.searchParams.get('estado');
    const solicitudes = await db.solicitudCombustible.findMany({
      where: estado ? { estado } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return NextResponse.json({ ok: true, data: solicitudes });
  } catch (e) {
    console.error('[cupet] Error:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
