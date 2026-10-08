import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  asegurarTablaReservas,
  loteActual,
  siguienteNumero,
  PRECIO_CILINDRO,
  MAX_POR_RESERVA,
  ZELLE_CILINDROS,
  PUNTO_RECOGIDA,
  ahoraEnCuba,
  HORA_CIERRE,
  type Reserva,
} from '@/lib/cilindros';
import { db } from '@/lib/db';

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
  website: z.string().optional(), // trampa anti-bots
});

export async function POST(request: NextRequest) {
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

    await asegurarTablaReservas();
    const lote = loteActual();
    const monto = PRECIO_CILINDRO * d.cantidad;

    // Reintento simple por si dos reservas piden el mismo número a la vez
    let numero = '';
    for (let intento = 0; intento < 3; intento++) {
      numero = await siguienteNumero();
      try {
        await db.$executeRawUnsafe(
          `INSERT INTO "ReservaCilindro"
            ("numero","nombreComprador","telefonoComprador","emailComprador","nombreRecoge","carnetRecoge","telefonoRecoge","cantidad","montoUsd","lote")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          numero,
          d.nombreComprador,
          d.telefonoComprador,
          d.emailComprador || null,
          d.nombreRecoge,
          d.carnetRecoge,
          d.telefonoRecoge || null,
          d.cantidad,
          monto,
          lote
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
          puntoRecogida: PUNTO_RECOGIDA,
          instrucciones: `Paga $${monto.toFixed(2)} por Zelle al ${ZELLE_CILINDROS} y pon la referencia ${numero}. Al confirmar el pago recibirás tu PIN de recogida.`,
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
        puntoRecogida: PUNTO_RECOGIDA,
      },
    });
  } catch (e) {
    console.error('[cilindros] Error al consultar:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
