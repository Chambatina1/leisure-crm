import { NextRequest, NextResponse } from 'next/server';
import { firmaWebhookValida } from '@/lib/quickbooks';
import { sincronizarPagos } from '@/lib/pagos-qbo';

// POST /api/quickbooks/webhook — Intuit avisa de pagos nuevos.
// Se verifica la firma y se revisan las facturas pendientes; la
// confirmación siempre se basa en lo que dice la factura en QuickBooks.
export async function POST(request: NextRequest) {
  const cuerpo = await request.text();
  if (!firmaWebhookValida(cuerpo, request.headers.get('intuit-signature'))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  // Intuit espera respuesta rápida: la revisión sigue en segundo plano
  void sincronizarPagos()
    .then((r) => r.confirmadas.length && console.log('[qbo] Pagos confirmados:', r.confirmadas.join(', ')))
    .catch((e) => console.error('[qbo] Error al sincronizar pagos:', e instanceof Error ? e.message : e));
  return NextResponse.json({ ok: true });
}
