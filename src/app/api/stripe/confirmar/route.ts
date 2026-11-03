import { NextRequest, NextResponse } from 'next/server';
import { aplicarSesion, getStripe } from '@/lib/stripe';

// POST /api/stripe/confirmar — al volver de Stripe Checkout, el navegador manda
// el id de la sesión y aquí se le pregunta a Stripe si está pagada. Así el pedido
// pasa a "pagado" aunque no haya webhook configurado.
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false }, { status: 503 });
  try {
    const { sessionId } = await request.json();
    if (typeof sessionId !== 'string' || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
      return NextResponse.json({ ok: false, error: 'Sesión inválida' }, { status: 400 });
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const estado = await aplicarSesion(session);
    return NextResponse.json({ ok: true, data: { pagado: session.payment_status === 'paid', estado } });
  } catch (error) {
    console.error('Error confirmando pago de Stripe:', error);
    return NextResponse.json({ ok: false, error: 'No se pudo confirmar el pago' }, { status: 500 });
  }
}
