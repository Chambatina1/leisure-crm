import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { asegurarTablaReservas } from '@/lib/cilindros';

// GET /api/cilindros/registro?buscar=texto (admin) — todas las compras de balitas
// pagadas o entregadas, de cualquier día, con su PIN y su cliente.
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    await asegurarTablaReservas();
    const buscar = (request.nextUrl.searchParams.get('buscar') || '').trim().slice(0, 80);
    const params: unknown[] = [];
    let filtro = '';
    if (buscar) {
      params.push(`%${buscar.toLowerCase()}%`);
      const digitos = buscar.replace(/\D/g, '');
      let porTelefono = '';
      if (digitos.length >= 4) {
        params.push(`%${digitos}%`);
        porTelefono = ` OR regexp_replace(COALESCE("telefonoComprador",''), '\\D', '', 'g') LIKE $2
          OR regexp_replace(COALESCE("telefonoRecoge",''), '\\D', '', 'g') LIKE $2`;
      }
      filtro = ` AND (LOWER("numero") LIKE $1 OR LOWER("nombreComprador") LIKE $1 OR LOWER(COALESCE("emailComprador",'')) LIKE $1
        OR LOWER("nombreRecoge") LIKE $1 OR "carnetRecoge" LIKE $1 OR COALESCE("pin",'') LIKE $1${porTelefono})`;
    }
    const filas = await db.$queryRawUnsafe<unknown[]>(
      `SELECT "id","numero","nombreComprador","telefonoComprador","emailComprador","nombreRecoge","carnetRecoge","telefonoRecoge",
              "cantidad","montoUsd","estado","pin","lote","puntoRecogida","pagadaEn","createdAt"
       FROM "ReservaCilindro" WHERE "estado" IN ('pagada','entregada')${filtro}
       ORDER BY COALESCE("pagadaEn","createdAt") DESC LIMIT 300`,
      ...params
    );
    return NextResponse.json({ ok: true, data: filas });
  } catch (e) {
    console.error('[cilindros] Error en el registro:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
