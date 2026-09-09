import { cupetGet } from '@/lib/cupet-proxy';
import { NextResponse } from 'next/server';

// GET /api/cupet/stock-public — combustible DISPONIBLE hoy (público):
// el cliente ve dónde hay gasolina/diesel, litros y precio por litro.
export async function GET() {
  try {
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

    const data = (stock.data || []).map((s: { servicenterId: number; codFuelOil: number; amount: number; priceXLiter: number }) => {
      const est = porEstacion.get(s.servicenterId) || { name: `Estación ${s.servicenterId}`, address: '' };
      return {
        servicenterId: s.servicenterId,
        typeFuelId: s.codFuelOil,
        estacionNombre: est.name,
        direccion: est.address,
        combustible: porTipo.get(s.codFuelOil) || `Tipo ${s.codFuelOil}`,
        litros: s.amount,
        precio: s.priceXLiter,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((est.name + ' ' + est.address).trim())}`,
      };
    });
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, data: [], error: 'Stock no disponible ahora' }, { status: 200 });
  }
}
