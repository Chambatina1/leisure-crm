import { NextRequest, NextResponse } from 'next/server';
import { cupetGet } from '@/lib/cupet-proxy';
import { db } from '@/lib/db';
import { asegurarTablaSolicitudes } from '@/lib/asegurar-tabla-cupet';

// GET /api/cupet/stock (admin) — dónde está la gasolina del distribuidor:
// estación (nombre+dirección), tipo de combustible, litros y precio.
const CLAVE_ADMIN = process.env.ADMIN_PASSWORD || 'ambitosmax2024'; // fase 1

export async function GET(request: NextRequest) {
  try {
    if (request.headers.get('x-admin-password') !== CLAVE_ADMIN) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }
    await asegurarTablaSolicitudes();

    const [stockR, estR, tiposR] = await Promise.all([
      cupetGet('/cupet/stock'),
      cupetGet('/cupet/servicentros'),
      cupetGet('/cupet/tipos'),
    ]);
    const stock = await stockR.json();
    const estaciones = await estR.json();
    const tipos = await tiposR.json();

    const porEstacion = new Map<number, { name: string; address: string }>();
    (estaciones.data || []).forEach((e: { servicenterId: number; servicenterName: string; address: string }) =>
      porEstacion.set(e.servicenterId, { name: e.servicenterName, address: e.address || 'Cuba' })
    );
    const porTipo = new Map<number, string>();
    (tipos.data || []).forEach((t: { typeFuelId: number; typeFuelName: string }) =>
      porTipo.set(t.typeFuelId, t.typeFuelName)
    );

    const data = (stock.data || []).map((s: { servicenterId: number; codFuelOil: number; amount: number; priceXLiter: number; currency?: string }) => {
      const est = porEstacion.get(s.servicenterId) || { name: `Estación ${s.servicenterId}`, address: '' };
      return {
        ...s,
        estacionNombre: est.name,
        direccion: est.address,
        combustible: porTipo.get(s.codFuelOil) || `Tipo ${s.codFuelOil}`,
        totalUsd: Number((s.amount * s.priceXLiter).toFixed(2)),
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((est.name + ' ' + est.address).trim())}`,
      };
    });

    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, error: 'Error consultando stock' }, { status: 500 });
  }
}
