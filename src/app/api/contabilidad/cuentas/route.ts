import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { cuentas } from '@/lib/quickbooks';

// GET /api/contabilidad/cuentas (admin) — categorías de gasto y cuentas de pago de QuickBooks
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const [gasto, pago] = await Promise.all([
      cuentas(['Expense', 'Other Expense', 'Cost of Goods Sold']),
      cuentas(['Bank', 'Credit Card']),
    ]);
    const orden = (a: { Name: string }, b: { Name: string }) => a.Name.localeCompare(b.Name);
    return NextResponse.json({ ok: true, data: { gasto: gasto.sort(orden), pago: pago.sort(orden) } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error de QuickBooks' }, { status: 502 });
  }
}
