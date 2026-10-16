import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { qboConectado, estadoResultados, gastosRecientes } from '@/lib/quickbooks';
import { rango, type Periodo } from '@/lib/contabilidad';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/contabilidad?periodo=semana|mes|anio  ó  ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD (admin)
// Ingresos, gastos y utilidad desde QuickBooks.
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  if (!(await qboConectado())) return NextResponse.json({ ok: true, conectado: false });
  const p = request.nextUrl.searchParams;
  const periodo = (['semana', 'mes', 'anio'].includes(p.get('periodo') || '') ? p.get('periodo') : 'mes') as Periodo;
  let { desde, hasta } = rango(periodo);
  if (FECHA.test(p.get('desde') || '') && FECHA.test(p.get('hasta') || '')) {
    desde = p.get('desde')!;
    hasta = p.get('hasta')!;
  }
  if (desde > hasta) return NextResponse.json({ ok: false, error: 'La fecha inicial es posterior a la final' }, { status: 400 });
  try {
    const [pyg, gastos] = await Promise.all([estadoResultados(desde, hasta), gastosRecientes(desde, hasta)]);
    return NextResponse.json({ ok: true, conectado: true, data: { pyg, gastos } });
  } catch (e) {
    console.error('[contabilidad] Error:', e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error de QuickBooks' }, { status: 502 });
  }
}
