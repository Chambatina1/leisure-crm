import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { registrarGasto } from '@/lib/quickbooks';

const schema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  monto: z.coerce.number().positive('El monto debe ser mayor que 0').max(1_000_000),
  cuentaGastoId: z.string().min(1, 'Elige la categoría del gasto'),
  cuentaPagoId: z.string().min(1, 'Elige de dónde salió el dinero'),
  descripcion: z.string().trim().min(3, 'Describe el gasto').max(500),
});

// POST /api/contabilidad/gasto (admin) — registra un gasto en QuickBooks
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || 'Datos inválidos';
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
  try {
    const id = await registrarGasto(parsed.data);
    return NextResponse.json({ ok: true, data: { id } }, { status: 201 });
  } catch (e) {
    console.error('[contabilidad] Error al registrar gasto:', e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error de QuickBooks' }, { status: 502 });
  }
}
