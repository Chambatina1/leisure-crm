import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { asegurarTablasBilletera, anotarMovimiento, avisarMovimiento, movimientos, aCentavos, usd, type Movimiento } from '@/lib/billetera';

// GET /api/billetera/admin?q=texto[&id=N] — billeteras con su saldo (o los movimientos de una)
export async function GET(request: NextRequest) {
  const no = requireAdmin(request);
  if (no) return no;
  await asegurarTablasBilletera();
  const sp = new URL(request.url).searchParams;
  const id = Number(sp.get('id'));
  if (id > 0) {
    const movs = await movimientos(id, 200);
    return NextResponse.json({ ok: true, data: movs.map((m: Movimiento) => ({ ...m, monto: m.centavos / 100 })) });
  }
  const q = (sp.get('q') || '').trim().slice(0, 80);
  const filas = await db.$queryRawUnsafe<{ id: number; codigo: string; nombre: string; email: string; telefono: string | null; saldo: bigint | number; ultimo: string | null }[]>(
    `SELECT b."id", b."codigo", u."nombre", u."email", u."telefono",
            COALESCE(SUM(m."centavos"), 0) AS saldo, MAX(m."createdAt") AS ultimo
     FROM "Billetera" b JOIN "User" u ON u."id" = b."userId"
     LEFT JOIN "MovimientoBilletera" m ON m."billeteraId" = b."id"
     WHERE $1 = '' OR b."codigo" ILIKE '%' || $1 || '%' OR u."nombre" ILIKE '%' || $1 || '%'
        OR u."email" ILIKE '%' || $1 || '%' OR COALESCE(u."telefono", '') ILIKE '%' || $1 || '%'
     GROUP BY b."id", u."id"
     ORDER BY MAX(m."createdAt") DESC NULLS LAST, b."id" DESC
     LIMIT 200`,
    q
  );
  const data = filas.map((f) => ({ ...f, saldo: Number(f.saldo) / 100 }));
  const total = data.reduce((s, f) => s + f.saldo, 0);
  return NextResponse.json({ ok: true, data, totalSaldos: Math.round(total * 100) / 100 });
}

// POST /api/billetera/admin — recarga a mano, devolución por Zelle o ajuste
const schema = z.object({
  billeteraId: z.number().int().positive(),
  tipo: z.enum(['recarga', 'devolucion', 'ajuste']),
  monto: z.number().refine((n) => Number.isFinite(n) && n !== 0 && Math.abs(n) <= 5000, 'Importe no válido'),
  nota: z.string().trim().min(3, 'Escribe una nota (por ejemplo, la fecha y el nombre del Zelle)').max(300),
});

export async function POST(request: NextRequest) {
  const no = requireAdmin(request);
  if (no) return no;
  const v = schema.safeParse(await request.json().catch(() => null));
  if (!v.success) return NextResponse.json({ ok: false, error: v.error.issues[0]?.message || 'Datos no válidos' }, { status: 400 });
  const { billeteraId, tipo, monto, nota } = v.data;
  // Recarga siempre suma, devolución siempre resta; el ajuste lleva su signo
  const centavos = tipo === 'recarga' ? aCentavos(Math.abs(monto)) : tipo === 'devolucion' ? -aCentavos(Math.abs(monto)) : aCentavos(monto);
  try {
    const r = await anotarMovimiento({ billeteraId, tipo, centavos, detalle: nota, creadoPor: 'admin' });
    if (!r.ok) {
      const error = r.motivo === 'saldo_insuficiente' ? `El saldo es ${usd(r.saldo)}: no puede quedar negativo` : 'No se pudo anotar';
      return NextResponse.json({ ok: false, error }, { status: 409 });
    }
    await avisarMovimiento(billeteraId, tipo, centavos, r.saldo);
    return NextResponse.json({ ok: true, saldo: r.saldo / 100 });
  } catch (e) {
    console.error('[billetera/admin] Error:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
