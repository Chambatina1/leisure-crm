import Stripe from 'stripe';
import { db } from '@/lib/db';

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

// Aplica a un pedido el resultado de una sesión de Checkout. Solo mueve pedidos
// que siguen esperando el pago, así que da igual si llega dos veces (webhook y
// vuelta del cliente). Devuelve el estado aplicado o null si no había nada que hacer.
export async function aplicarSesion(session: Stripe.Checkout.Session, tipo?: string): Promise<'pagado' | 'cancelado' | null> {
  const pedidoId = Number(session.metadata?.pedidoId);
  if (!pedidoId) return null;
  let estado: 'pagado' | 'cancelado' | null = null;
  if (session.payment_status === 'paid' || tipo === 'checkout.session.async_payment_succeeded') estado = 'pagado';
  else if (tipo === 'checkout.session.async_payment_failed' || tipo === 'checkout.session.expired') estado = 'cancelado';
  if (!estado) return null;
  await db.pedido.updateMany({ where: { id: pedidoId, estado: 'pendiente_pago' }, data: { estado } });
  return estado;
}
