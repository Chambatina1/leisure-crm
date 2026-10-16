import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getCliente, respuestaSinRegistro } from '@/lib/cliente-auth';
import { db } from '@/lib/db';
import { asegurarTablaSolicitudes } from '@/lib/asegurar-tabla-cupet';
import { z } from 'zod';
import { facturarSolicitud } from '@/lib/pagos-qbo';
import { qboConectado } from '@/lib/quickbooks';

// ═══════════════════════════════════════════════════════════════
// /api/cupet/solicitud — Solicitudes de combustible (FASE 1)
//   POST (público): crear solicitud → cliente paga por Zelle
//   GET  (admin):   listar solicitudes pendientes/todas
// ═══════════════════════════════════════════════════════════════


const solicitudSchema = z.object({
  nombreComprador: z.string().min(3).max(100),
  telefonoComprador: z.string().min(5).max(20),
  emailComprador: z.string().email('Email válido requerido'),
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
  const cliente = await getCliente(request);
  if (!cliente) return respuestaSinRegistro();
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

    // Pago con QuickBooks (tarjeta o banco); si no está conectado, Zelle
    const conQbo = await qboConectado();
    let pagoUrl: string | null = null;
    try {
      pagoUrl = await facturarSolicitud(sol);
    } catch (e) {
      console.error('[qbo] No se pudo crear la factura de', sol.numero, e instanceof Error ? e.message : e);
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          numero: sol.numero,
          montoUsd: sol.montoUsd,
          pagoUrl,
          zelle: conQbo ? null : '727-598-6802',
          instrucciones: pagoUrl
            ? `Paga $${sol.montoUsd.toFixed(2)} con tarjeta o cuenta de banco en el enlace seguro de QuickBooks. En cuanto QuickBooks confirme el pago te enviaremos el PIN de carga.`
            : conQbo
            ? 'Tu solicitud quedó registrada. En unos minutos te llegará por correo el enlace de pago de QuickBooks.'
            : 'Paga por Zelle al 727-598-6802 el monto exacto y usa la referencia ' +
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
    if (!isAdminRequest(request)) {
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
