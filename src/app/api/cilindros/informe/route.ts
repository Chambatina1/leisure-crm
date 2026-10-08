import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { reservasDelLote, informeHtml, loteActual } from '@/lib/cilindros';

// GET /api/cilindros/informe?lote=YYYY-MM-DD (admin) — listado imprimible
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  const p = request.nextUrl.searchParams.get('lote');
  const lote = p && /^\d{4}-\d{2}-\d{2}$/.test(p) ? p : loteActual();
  const reservas = await reservasDelLote(lote, true);
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Recogida de cilindros ${lote}</title>
<style>@media print{.no-print{display:none}} body{margin:24px;background:#fff}</style></head>
<body><div class="no-print" style="text-align:right;margin-bottom:12px"><button onclick="window.print()" style="padding:8px 16px;font-size:14px">Imprimir</button></div>
${informeHtml(lote, reservas)}</body></html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
