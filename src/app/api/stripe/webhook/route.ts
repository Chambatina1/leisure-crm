import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { db } from '@/lib/db';
import { getStripe } from '@/lib/stripe';

// POST /api/stripe/webhook — Stripe avisa aquí cuando un pago se completa o caduca.
// Configurar en Stripe → Developers → Webhooks con la URL
// https://ambitosmax.com/api/stripe/webhook y los eventos
// checkout.session.completed, checkout.session.async_payment_succeeded,
// checkout.session.async_payment_failed y checkout.session.expired.
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ ok: false }, { status: 503 });

  // La firma se comprueba sobre el cuerpo exacto, sin parsear
  const body = await request.text();
  const firma = request.headers.get('stripe-signature') || '';
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, firma, secret);
  } catch (err) {
    console.error('Webhook de Stripe con firma inválida:', err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    if (event.type.startsWith('checkout.session.')) {
      const session = event.data.object as Stripe.Checkout.Session;
      const pedidoId = Number(session.metadata?.pedidoId);
      if (pedidoId) {
        let estado: string | null = null;
        if (
          (event.type === 'checkout.session.completed' && session.payment_status === 'paid') ||
          event.type === 'checkout.session.async_payment_succeeded'
        ) {
          estado = 'pagado';
        } else if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
          estado = 'cancelado';
        }
        // Solo se mueven pedidos que siguen esperando el pago (los reintentos de Stripe no pisan nada)
        if (estado) {
          await db.pedido.updateMany({ where: { id: pedidoId, estado: 'pendiente_pago' }, data: { estado } });
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error procesando webhook de Stripe:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
