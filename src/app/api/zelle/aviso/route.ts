import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { claveValida, procesarAviso } from '@/lib/zelle';

// POST /api/zelle/aviso — lo llama el script de Gmail (scripts/zelle-gmail.gs)
// con cada aviso de Zelle del banco. Responde qué se hizo para que el script
// etiquete el correo ("Zelle/Aplicado" o "Zelle/Revisar").
const avisoSchema = z.object({
  mensajeId: z.string().min(5).max(200),
  from: z.string().max(300),
  asunto: z.string().max(500).default(''),
  cuerpo: z.string().max(30000).default(''),
  autenticacion: z.string().max(5000).default(''),
});

export async function POST(request: NextRequest) {
  const clave = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null;
  if (!process.env.ZELLE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: 'Falta ZELLE_WEBHOOK_SECRET en el servidor' }, { status: 503 });
  }
  if (!claveValida(clave)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const datos = avisoSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ ok: false, error: 'Datos no válidos' }, { status: 400 });

  try {
    const r = await procesarAviso(datos.data);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.error('[zelle] Error procesando aviso:', e);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
