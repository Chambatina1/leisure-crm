import Stripe from 'stripe';

// Cliente de Stripe. Sin STRIPE_SECRET_KEY la tienda sigue funcionando como
// antes (pedido sin pago en línea), así que esto devuelve null.
let cliente: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cliente) cliente = new Stripe(key);
  return cliente;
}

// Dirección pública del sitio para volver de Stripe (en local, la del request)
export function urlBase(requestUrl: string): string {
  return process.env.SITE_URL || new URL(requestUrl).origin;
}
