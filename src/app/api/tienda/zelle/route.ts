import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCliente, respuestaSinRegistro } from '@/lib/cliente-auth';
import { esBalitaGas, quedanEnPunto, textoPunto } from '@/lib/puntos-gas';
import { leerPuntosDisponibles } from '@/lib/puntos-recogida';
import { existenciasDisponibles, itemsAMetadata } from '@/lib/existencia';
import {
  asegurarTablaReservas,
  loteActual,
  siguienteNumero,
  MAX_POR_RESERVA,
  ZELLE_CILINDROS,
  ZELLE_DESTINO,
  ahoraEnCuba,
  HORA_CIERRE,
  textoRecogida,
  esc,
} from '@/lib/cilindros';
import { confirmarReservaCilindro } from '@/lib/confirmar-reserva';
import { enviarCorreo } from '@/lib/mailer';
import { billeteraDeUsuario, saldoCentavos, cobrarCompra, reintegrarCompra, usd } from '@/lib/billetera';

// POST /api/tienda/zelle — compra de la tienda pagada por Zelle.
//  - Carrito de balitas de gas: se crea una reserva RC-000123. Cuando llega el
//    aviso de Zelle con esa referencia, el pago se confirma solo y se envía el PIN.
//  - Otros productos: se crea el pedido pendiente de pago (se confirma a mano).
// Los precios salen siempre de la base de datos, nunca del navegador.
const schema = z.object({
  nombreComprador: z.string().trim().min(2, 'El nombre del comprador es requerido').max(100),
  emailComprador: z.string().trim().email('Email inválido').max(150).optional().or(z.literal('')),
  telefonoComprador: z.string().trim().min(7, 'El teléfono del comprador es requerido').max(20),
  nombreDestinatario: z.string().trim().min(2, 'El nombre del destinatario es requerido').max(100),
  telefonoDestinatario: z.string().trim().min(7, 'El teléfono del destinatario es requerido').max(20),
  carnetDestinatario: z.string().trim().max(20).optional().or(z.literal('')),
  direccionDestinatario: z.string().trim().min(5, 'La dirección es requerida').max(300),
  notas: z.string().max(1000).optional().or(z.literal('')),
  items: z
    .array(z.object({ id: z.number().int().positive(), qty: z.number().int().min(1).max(50) }))
    .min(1, 'El carrito está vacío')
    .max(30),
  puntoRecogida: z.string().max(60).optional(),
  // Pagar con el saldo de la billetera en vez de mandar un Zelle nuevo
  pagarConSaldo: z.boolean().optional(),
});

const fallo = (body: Record<string, unknown>, status: number) => NextResponse.json({ ok: false, ...body }, { status });

export async function POST(request: NextRequest) {
  const cliente = await getCliente(request);
  if (!cliente) return respuestaSinRegistro();

  try {
    const validated = schema.safeParse(await request.json().catch(() => null));
    if (!validated.success) return fallo({ error: validated.error.flatten().fieldErrors }, 400);
    const data = validated.data;

    const cantidades = new Map<number, number>();
    for (const i of data.items) cantidades.set(i.id, (cantidades.get(i.id) || 0) + i.qty);
    const productos = await db.tiendaProduct.findMany({ where: { id: { in: [...cantidades.keys()] }, activo: true } });
    if (productos.length !== cantidades.size) {
      return fallo({ error: 'Algún producto ya no está disponible. Revisa tu carrito.' }, 409);
    }
    // El diésel y la gasolina tienen su propio flujo de compra
    if (productos.some((p) => (p.categoria === 'combustible' && !esBalitaGas(p.nombre)) || p.precio <= 0)) {
      return fallo({ error: 'Hay productos en el carrito que no se pagan por aquí.' }, 400);
    }

    const lineas = productos.map((p) => ({ p, qty: cantidades.get(p.id)! }));
    const total = lineas.reduce((s, l) => s + Math.round(l.p.precio * 100) * l.qty, 0) / 100;
    const resumen = lineas.map((l) => `${l.qty}x ${l.p.nombre} ($${l.p.precio.toFixed(2)})`).join(', ');
    const gas = lineas.filter((l) => esBalitaGas(l.p.nombre));
    const centavos = lineas.reduce((s, l) => s + Math.round(l.p.precio * 100) * l.qty, 0);

    // Pago con saldo: comprobar antes de crear nada (se vuelve a comprobar al cobrar)
    const billetera = data.pagarConSaldo ? await billeteraDeUsuario(cliente.id) : null;
    if (billetera) {
      const saldo = await saldoCentavos(billetera.id);
      if (saldo < centavos) {
        return fallo({ sinSaldo: true, saldo: saldo / 100, error: `Tu saldo es ${usd(saldo)} y la compra cuesta ${usd(centavos)}. Recarga tu billetera o paga por Zelle.` }, 402);
      }
    }

    // No vender más de lo que queda (la existencia solo baja con pagos confirmados)
    const stock = await existenciasDisponibles([...cantidades.keys()]);
    const sinStock = productos.find((p) => {
      const hay = stock.get(p.id);
      return hay !== null && hay !== undefined && cantidades.get(p.id)! > hay;
    });
    if (sinStock) {
      const hay = stock.get(sinStock.id) ?? 0;
      return fallo({ error: hay > 0 ? `Solo quedan ${hay} de ${sinStock.nombre}. Ajusta tu carrito.` : `${sinStock.nombre} está agotado.` }, 409);
    }

    // ── Balitas de gas: reserva RC- que se confirma sola con el aviso de Zelle ──
    if (gas.length) {
      if (gas.length !== lineas.length) {
        return fallo({ error: 'Las balitas de gas se pagan aparte. Quita los demás productos del carrito y cómpralos en otro pedido.' }, 400);
      }
      const balitas = gas.reduce((s, l) => s + l.qty, 0);
      if (balitas > MAX_POR_RESERVA) return fallo({ error: `Máximo ${MAX_POR_RESERVA} balitas por compra.` }, 400);
      const carnet = (data.carnetDestinatario || '').replace(/\s/g, '');
      if (!/^\d{11}$/.test(carnet)) {
        return fallo({ error: { carnetDestinatario: ['El carnet de quien recoge debe tener 11 dígitos'] } }, 400);
      }
      const punto = (await leerPuntosDisponibles()).find((p) => p.activo && p.id === data.puntoRecogida);
      if (!punto) return fallo({ faltaPunto: true, error: 'Elige dónde vas a recoger la balita de gas' }, 400);
      const enPunto = quedanEnPunto(punto);
      if (enPunto !== null && balitas > enPunto) {
        return fallo(
          {
            faltaPunto: true,
            error: enPunto > 0
              ? `En ${punto.nombre} solo quedan ${enPunto} balitas. Elige otro punto o ajusta tu carrito.`
              : `En ${punto.nombre} no quedan balitas. Elige otro punto.`,
          },
          409
        );
      }
      const lugar = textoPunto(punto);

      await asegurarTablaReservas();
      const lote = loteActual();
      let numero = '';
      let reservaId = 0;
      for (let intento = 0; intento < 3; intento++) {
        numero = await siguienteNumero();
        try {
          const ins = await db.$queryRawUnsafe<{ id: number }[]>(
            `INSERT INTO "ReservaCilindro"
              ("numero","nombreComprador","telefonoComprador","emailComprador","nombreRecoge","carnetRecoge","telefonoRecoge","cantidad","montoUsd","lote","puntoId","puntoRecogida","items")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING "id"`,
            numero,
            data.nombreComprador,
            data.telefonoComprador,
            data.emailComprador || cliente.email,
            data.nombreDestinatario,
            carnet,
            data.telefonoDestinatario,
            balitas,
            total,
            lote,
            punto.id,
            lugar,
            itemsAMetadata(gas.map((l) => ({ id: l.p.id, qty: l.qty })))
          );
          reservaId = ins[0].id;
          break;
        } catch (e) {
          if (intento === 2) throw e;
        }
      }
      // ── Pagada con saldo: se cobra y se confirma en el acto (PIN por correo) ──
      if (billetera) {
        const cobro = await cobrarCompra(billetera.id, centavos, numero, `${numero}: ${resumen}`);
        if (!cobro.ok) {
          await db.$executeRawUnsafe(`UPDATE "ReservaCilindro" SET "estado"='anulada', "notas"='No alcanzó el saldo de la billetera' WHERE "id"=$1`, reservaId);
          return fallo({ sinSaldo: true, saldo: cobro.saldo / 100, error: `Tu saldo (${usd(cobro.saldo)}) no alcanza para esta compra.` }, 402);
        }
        const conf = await confirmarReservaCilindro(reservaId, `Pagado con saldo ${billetera.codigo}`, { monto: total, asunto: `Saldo de billetera ${billetera.codigo}`, billetera: billetera.codigo });
        if (!conf.ok) {
          await reintegrarCompra(billetera.id, centavos, numero, `No se pudo confirmar ${numero}: ${conf.error}`);
          await db.$executeRawUnsafe(`UPDATE "ReservaCilindro" SET "estado"='anulada' WHERE "id"=$1 AND "estado"='pendiente_pago'`, reservaId);
          return fallo({ error: 'No se pudo completar la compra. No se te cobró nada.' }, 500);
        }
        return NextResponse.json(
          {
            ok: true,
            data: {
              tipo: 'balitas',
              pagadoConSaldo: true,
              referencia: numero,
              montoUsd: total,
              saldo: cobro.saldo / 100,
              pin: conf.data.pin,
              correo: conf.correo,
              puntoRecogida: lugar,
              resumen,
              recogida: textoRecogida(conf.data.lote),
            },
          },
          { status: 201 }
        );
      }

      const { hora } = ahoraEnCuba();
      return NextResponse.json(
        {
          ok: true,
          data: {
            tipo: 'balitas',
            referencia: numero,
            montoUsd: total,
            zelle: ZELLE_CILINDROS,
            puntoRecogida: lugar,
            resumen,
            despuesDelCierre: hora >= HORA_CIERRE,
            recogida: textoRecogida(lote),
          },
        },
        { status: 201 }
      );
    }

    // ── Otros productos: pedido pendiente de pago, se confirma a mano ──
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
        notas: [billetera ? `Pagado con saldo de la billetera ${billetera.codigo}` : 'Pago por Zelle pendiente', data.notas].filter(Boolean).join('\n'),
        estado: billetera ? 'pagado' : 'pendiente_pago',
      },
    });
    if (billetera) {
      const ref = `Pedido ${pedido.id}`;
      const cobro = await cobrarCompra(billetera.id, centavos, ref, `${ref}: ${resumen}`);
      if (!cobro.ok) {
        await db.pedido.update({ where: { id: pedido.id }, data: { estado: 'cancelado', notas: 'No alcanzó el saldo de la billetera' } });
        return fallo({ sinSaldo: true, saldo: cobro.saldo / 100, error: `Tu saldo (${usd(cobro.saldo)}) no alcanza para esta compra.` }, 402);
      }
      await enviarCorreo({
        to: ZELLE_DESTINO,
        subject: `Pagado con saldo ${ref} · ${usd(centavos)} · ${billetera.codigo}`,
        text: `${ref} pagado con el saldo de la billetera ${billetera.codigo} (${cliente.nombre}, ${cliente.email}): ${resumen}. Total ${usd(centavos)}. Entrega a ${data.nombreDestinatario}, ${data.telefonoDestinatario}, ${data.direccionDestinatario}.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;color:#111827">
          <h2 style="color:#071a46">${esc(ref)} pagado con saldo</h2>
          <p>Billetera <b>${esc(billetera.codigo)}</b> · ${esc(cliente.nombre)} · ${esc(cliente.email)}</p>
          <p>${esc(resumen)}<br>Total <b>${usd(centavos)}</b></p>
          <p>Entrega: ${esc(data.nombreDestinatario)} · ${esc(data.telefonoDestinatario)}<br>${esc(data.direccionDestinatario)}</p>
        </div>`,
      }).catch((e) => console.error('[tienda/saldo] No se pudo avisar a ventas:', e instanceof Error ? e.message : e));
      return NextResponse.json(
        { ok: true, data: { tipo: 'pedido', pagadoConSaldo: true, referencia: ref, montoUsd: total, saldo: cobro.saldo / 100, resumen } },
        { status: 201 }
      );
    }
    return NextResponse.json(
      { ok: true, data: { tipo: 'pedido', referencia: `Pedido ${pedido.id}`, montoUsd: total, zelle: ZELLE_DESTINO, resumen } },
      { status: 201 }
    );
  } catch (e) {
    console.error('[tienda/zelle] Error:', e);
    return fallo({ error: 'No se pudo crear la compra' }, 500);
  }
}
