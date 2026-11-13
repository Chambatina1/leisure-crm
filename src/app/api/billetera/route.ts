import { NextRequest, NextResponse } from 'next/server';
import { getCliente } from '@/lib/cliente-auth';
import { billeteraDeUsuario, saldoCentavos, movimientos, topeSaldo } from '@/lib/billetera';
import { ZELLE_DESTINO } from '@/lib/cilindros';

// GET /api/billetera — saldo, código BM- y últimos movimientos del cliente con sesión
export async function GET(request: NextRequest) {
  const cliente = await getCliente(request);
  if (!cliente) return NextResponse.json({ ok: false, requiereRegistro: true, error: 'Inicia sesión para ver tu billetera' }, { status: 401 });
  try {
    const b = await billeteraDeUsuario(cliente.id);
    const [saldo, movs] = await Promise.all([saldoCentavos(b.id), movimientos(b.id, 30)]);
    return NextResponse.json({
      ok: true,
      data: {
        codigo: b.codigo,
        saldo: saldo / 100,
        tope: topeSaldo(),
        zelle: ZELLE_DESTINO,
        movimientos: movs.map((m) => ({
          id: m.id,
          tipo: m.tipo,
          monto: m.centavos / 100,
          referencia: m.tipo === 'recarga' ? null : m.referencia, // el id del correo del banco no le sirve al cliente
          detalle: m.tipo === 'compra' ? m.detalle : null,
          fecha: m.createdAt,
        })),
      },
    });
  } catch (e) {
    console.error('[billetera] Error:', e);
    return NextResponse.json({ ok: false, error: 'No se pudo cargar la billetera' }, { status: 500 });
  }
}
