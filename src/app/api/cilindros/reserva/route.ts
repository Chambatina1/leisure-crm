import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  asegurarTablaReservas,
  loteActual,
  siguienteNumero,
  PRECIO_CILINDRO,
  MAX_POR_RESERVA,
  ZELLE_CILINDROS,
  lugarDe,
  ahoraEnCuba,
  HORA_CIERRE,
  type Reserva,
} from '@/lib/cilindros';
import { db } from '@/lib/db';
import { getCliente, respuestaSinRegistro } from '@/lib/cliente-auth';
import { leerPuntosDisponibles } from '@/lib/puntos-recogida';
import { esBalitaGas, quedanEnPunto, textoPunto } from '@/lib/puntos-gas';
import { existenciasDisponibles, itemsAMetadata } from '@/lib/existencia';

// ═══════════════════════════════════════════════════════════════
// /api/cilindros/reserva
//   POST (público): crear reserva de cilindro → pagar por Zelle
//   GET  (público): consultar estado y PIN (número + teléfono)
// ═══════════════════════════════════════════════════════════════

const porIp = new Map<string, { n: number; hasta: number }>();
function permitido(ip: string, max: number) {
  const ahora = Date.now();
  const r = porIp.get(ip);
  if (!r || r.hasta < ahora) {
    porIp.set(ip, { n: 1, hasta: ahora + 15 * 60 * 1000 });
    return true;
  }
  r.n += 1;
  return r.n <= max;
}
const ipDe = (r: NextRequest) =>
  r.headers.get('x-forwarded-for')?.split(',')[0].trim() || r.headers.get('x-real-ip') || 'desconocida';

const schema = z.object({
  nombreComprador: z.string().trim().min(3, 'Escribe tu nombre').max(100),
  telefonoComprador: z.string().trim().min(7, 'Teléfono inválido').max(20),
  emailComprador: z.string().trim().email('Correo inválido').max(150).optional().or(z.literal('')),
  nombreRecoge: z.string().trim().min(3, 'Nombre de quien recoge').max(100),
  carnetRecoge: z.string().trim().regex(/^\d{11}$/, 'El carnet debe tener 11 dígitos'),
  telefonoRecoge: z.string().trim().max(20).optional().or(z.literal('')),
  cantidad: z.coerce.number().int().min(1).max(MAX_POR_RESERVA),
  puntoRecogida: z.string().trim().max(60).optional().default(''),
  website: z.string().optional(), // trampa anti-bots
});

export async function POST(request: NextRequest) {
  const cliente = await getCliente(request);
  if (!cliente) return respuestaSinRegistro();
  try {
    if (!permitido(`res:${ipDe(request)}`, 10)) {
      return NextResponse.json({ ok: false, error: 'Demasiadas reservas. Espera unos minutos.' }, { status: 429 });
    }
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || 'Datos inválidos';
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
    const d = parsed.data;
    if (d.website) return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });

    // El cliente elige en qué punto de gas recoge (los mismos de la tienda)
    const punto = (await leerPuntosDisponibles()).find((p) => p.activo && p.id === d.puntoRecogida);
    if (!punto) return NextResponse.json({ ok: false, faltaPunto: true, error: 'Elige el punto donde vas a recoger' }, { status: 400 });
    const quedan = quedanEnPunto(punto);
    if (quedan !== null && d.cantidad > quedan) {
      return NextResponse.json(
        { ok: false, faltaPunto: true, error: quedan > 0 ? `En ${punto.nombre} solo quedan ${quedan}. Elige otro punto o menos cilindros.` : `En ${punto.nombre} no quedan cilindros. Elige otro punto.` },
        { status: 409 }
      );
    }
    const lugar = textoPunto(punto);

    await asegurarTablaReservas();
    const lote = loteActual();
    const monto = PRECIO_CILINDRO * d.cantidad;

    // Esta página vende la balita de la tienda que vale ${PRECIO_CILINDRO}: respeta su existencia
    const producto = (await db.tiendaProduct.findMany({ where: { activo: true, precio: PRECIO_CILINDRO } })).find((p) =>
      esBalitaGas(p.nombre)
    );
    if (producto) {
      const hay = (await existenciasDisponibles([producto.id])).get(producto.id);
      if (hay !== null && hay !== undefined && d.cantidad > hay) {
        return NextResponse.json(
          { ok: false, agotado: hay <= 0, error: hay > 0 ? `Solo quedan ${hay} cilindros.` : 'Los cilindros están agotados por ahora.' },
          { status: 409 }
        );
      }
    }

    // Reintento simple por si dos reservas piden el mismo número a la vez
    let numero = '';
    for (let intento = 0; intento < 3; intento++) {
      numero = await siguienteNumero();
      try {
        await db.$executeRawUnsafe(
          `INSERT INTO "ReservaCilindro"
            ("numero","nombreComprador","telefonoComprador","emailComprador","nombreRecoge","carnetRecoge","telefonoRecoge","cantidad","montoUsd","lote","puntoId","puntoRecogida","items")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          numero,
          d.nombreComprador,
          d.telefonoComprador,
          d.emailComprador || cliente.email,
          d.nombreRecoge,
          d.carnetRecoge,
          d.telefonoRecoge || null,
          d.cantidad,
          monto,
          lote,
          punto.id,
          lugar,
          producto ? itemsAMetadata([{ id: producto.id, qty: d.cantidad }]) : null
        );
        break;
      } catch (e) {
        if (intento === 2) throw e;
      }
    }

    const { hora } = ahoraEnCuba();
    return NextResponse.json(
      {
        ok: true,
        data: {
          numero,
          cantidad: d.cantidad,
          montoUsd: monto,
          zelle: ZELLE_CILINDROS,
          lote,
          despuesDelCierre: hora >= HORA_CIERRE,
          puntoRecogida: lugar,
          instrucciones: `Paga $${monto.toFixed(2)} por Zelle a ${ZELLE_CILINDROS} y escribe ${numero} en la nota (memo) del pago. Al confirmarse el pago recibirás tu PIN de recogida por correo.`,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error('[cilindros] Error al reservar:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!permitido(`cons:${ipDe(request)}`, 30)) {
      return NextResponse.json({ ok: false, error: 'Demasiadas consultas. Espera unos minutos.' }, { status: 429 });
    }
    const numero = (request.nextUrl.searchParams.get('numero') || '').trim().toUpperCase();
    const telefono = (request.nextUrl.searchParams.get('telefono') || '').replace(/\D/g, '');
    if (!/^RC-\d{6}$/.test(numero) || telefono.length < 7) {
      return NextResponse.json({ ok: false, error: 'Escribe el número de reserva (RC-000000) y tu teléfono' }, { status: 400 });
    }
    await asegurarTablaReservas();
    const filas = await db.$queryRawUnsafe<Reserva[]>(
      `SELECT * FROM "ReservaCilindro" WHERE "numero" = $1`,
      numero
    );
    const r = filas[0];
    // Mismo mensaje si no existe o si el teléfono no coincide (no revelar reservas ajenas)
    if (!r || r.telefonoComprador.replace(/\D/g, '').slice(-7) !== telefono.slice(-7)) {
      return NextResponse.json({ ok: false, error: 'No encontramos esa reserva con ese teléfono' }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      data: {
        numero: r.numero,
        estado: r.estado,
        cantidad: r.cantidad,
        montoUsd: r.montoUsd,
        lote: r.lote,
        nombreRecoge: r.nombreRecoge,
        pin: r.estado === 'pagada' ? r.pin : null,
        puntoRecogida: lugarDe(r),
      },
    });
  } catch (e) {
    console.error('[cilindros] Error al consultar:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
