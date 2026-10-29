import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCliente, respuestaSinRegistro } from '@/lib/cliente-auth';
import { getStripe, urlBase } from '@/lib/stripe';

const checkoutSchema = z.object({
  nombreComprador: z.string().min(2, 'El nombre del comprador es requerido'),
  emailComprador: z.string().email('Email inválido').optional().or(z.literal('')),
  telefonoComprador: z.string().min(7, 'El teléfono del comprador es requerido'),
  nombreDestinatario: z.string().min(2, 'El nombre del destinatario es requerido'),
  telefonoDestinatario: z.string().min(7, 'El teléfono del destinatario es requerido'),
  carnetDestinatario: z.string().optional().or(z.literal('')),
  direccionDestinatario: z.string().min(5, 'La dirección es requerida'),
  notas: z.string().optional().or(z.literal('')),
  items: z
    .array(z.object({ id: z.number().int().positive(), qty: z.number().int().min(1).max(50) }))
    .min(1, 'El carrito está vacío')
    .max(30),
});

// POST /api/stripe/checkout — crea el pedido (pendiente de pago) y la sesión de
// Stripe Checkout. Los precios salen siempre de la base de datos, nunca del navegador.
export async function POST(request: NextRequest) {
  const cliente = await getCliente(request);
  if (!cliente) return respuestaSinRegistro();

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ ok: false, sinStripe: true, error: 'Pago con tarjeta no disponible' }, { status: 503 });
  }

  try {
    const validated = checkoutSchema.safeParse(await request.json());
    if (!validated.success) {
      return NextResponse.json({ ok: false, error: validated.error.flatten().fieldErrors }, { status: 400 });
    }
    const data = validated.data;

    // Juntar cantidades del mismo producto y buscar los productos activos
    const cantidades = new Map<number, number>();
    for (const i of data.items) cantidades.set(i.id, (cantidades.get(i.id) || 0) + i.qty);
    const productos = await db.tiendaProduct.findMany({
      where: { id: { in: [...cantidades.keys()] }, activo: true },
    });
    if (productos.length !== cantidades.size) {
      return NextResponse.json({ ok: false, error: 'Algún producto ya no está disponible. Revisa tu carrito.' }, { status: 409 });
    }
    // El diésel y la gasolina tienen su propio flujo de compra; el cilindro de gas sí se paga aquí
    if (productos.some((p) => (p.categoria === 'combustible' && !/CILINDRO/i.test(p.nombre)) || p.precio <= 0)) {
      return NextResponse.json({ ok: false, error: 'Hay productos en el carrito que no se pagan por aquí.' }, { status: 400 });
    }

    const lineas = productos.map((p) => ({ p, qty: cantidades.get(p.id)! }));
    const total = lineas.reduce((s, l) => s + Math.round(l.p.precio * 100) * l.qty, 0) / 100;
    const resumen = lineas.map((l) => `${l.qty}x ${l.p.nombre} ($${l.p.precio.toFixed(2)})`).join(', ');

    const pedido = await db.pedido.create({
      data: {
        nombreComprador: data.nombreComprador,
        emailComprador: data.emailComprador || cliente.email,
        telefonoComprador: data.telefonoComprador,
        nombreDestinatario: data.nombreDestinatario,
        telefonoDestinatario: data.telefonoDestinatario,
        carnetDestinatario: data.carnetDestinatario || null,
        direccionDestinatario: data.direccionDestinatario,
        producto: `${resumen} — Total $${total.toFixed(2)}`,
        notas: data.notas || null,
        estado: 'pendiente_pago',
      },
    });

    const base = urlBase(request.url);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: data.emailComprador || cliente.email,
      client_reference_id: String(pedido.id),
      metadata: { pedidoId: String(pedido.id), userId: String(cliente.id) },
      payment_intent_data: { metadata: { pedidoId: String(pedido.id) }, description: `Pedido #${pedido.id} Ambitosmax` },
      line_items: lineas.map((l) => ({
        quantity: l.qty,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(l.p.precio * 100),
          product_data: { name: l.p.nombre, ...(l.p.descripcion ? { description: l.p.descripcion.slice(0, 500) } : {}) },
        },
      })),
      // Stripe sustituye {CHECKOUT_SESSION_ID}; con él confirmamos el pago al volver
      success_url: `${base}/?pago=ok&pedido=${pedido.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/?pago=cancelado&pedido=${pedido.id}`,
    });

    await db.pedido.update({
      where: { id: pedido.id },
      data: { notas: [data.notas, `Stripe: ${session.id}`].filter(Boolean).join('\n') },
    });

    return NextResponse.json({ ok: true, data: { url: session.url, pedidoId: pedido.id } });
  } catch (error) {
    console.error('Error creando checkout de Stripe:', error);
    return NextResponse.json({ ok: false, error: 'No se pudo iniciar el pago' }, { status: 500 });
  }
}
