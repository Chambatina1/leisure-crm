import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// POST /api/ai-knowledge/import — { entries: [...] } (formato del botón "Exportar")
// El panel de entrenamiento ya llamaba a esta ruta pero no existía (404).
const entrySchema = z.object({
  categoria: z.string().min(1).max(60),
  pregunta: z.string().min(2).max(1000),
  respuesta: z.string().min(2).max(5000),
  keywords: z.array(z.string().max(60)).max(50).optional(),
  activa: z.boolean().optional(),
  prioridad: z.number().int().optional(),
});

const bodySchema = z.object({ entries: z.array(z.unknown()).max(1000) });

function keywordsDe(pregunta: string): string[] {
  return pregunta
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 20);
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Formato inválido' }, { status: 400 });
    }

    const validas = parsed.data.entries
      .map((e) => entrySchema.safeParse(e))
      .filter((r) => r.success)
      .map((r) => r.data!);

    if (validas.length === 0) {
      return NextResponse.json({ ok: false, error: 'No hay entradas válidas en el archivo' }, { status: 400 });
    }

    const result = await db.aIKnowledge.createMany({
      data: validas.map((e) => ({
        categoria: e.categoria,
        pregunta: e.pregunta,
        respuesta: e.respuesta,
        keywords: e.keywords && e.keywords.length ? e.keywords : keywordsDe(e.pregunta),
        activa: e.activa ?? true,
        prioridad: e.prioridad ?? 0,
      })),
    });

    return NextResponse.json({
      ok: true,
      data: { count: result.count, descartadas: parsed.data.entries.length - validas.length },
    });
  } catch (error) {
    console.error('[AI Knowledge] Error al importar:', error);
    return NextResponse.json({ ok: false, error: 'Error al importar' }, { status: 500 });
  }
}
