import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { aplicarSesion, getStripe } from '@/lib/stripe';

// POST /api/stripe/webhook — Stripe avisa aquí cuando un pago se completa o caduca.
// Es opcional: el pago también se confirma cuando el cliente vuelve de Stripe
// (/api/stripe/confirmar), pero el webhook cubre a quien cierra la pestaña antes.
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
      await aplicarSesion(event.data.object as Stripe.Checkout.Session, event.type);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error procesando webhook de Stripe:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
