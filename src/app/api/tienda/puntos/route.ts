import { NextResponse } from 'next/server';
import { leerPuntosDisponibles } from '@/lib/puntos-recogida';

// GET /api/tienda/puntos — puntos de recogida activos (para elegir al pagar)
// Siempre al día: lo que queda cambia con cada compra
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const puntos = (await leerPuntosDisponibles()).filter((p) => p.activo);
    return NextResponse.json({ ok: true, data: puntos });
  } catch (error) {
    console.error('Error leyendo puntos de recogida:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener puntos' }, { status: 500 });
  }
}
