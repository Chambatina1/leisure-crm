import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import ZAI from 'z-ai-web-dev-sdk';
import { BUSINESS_CONTEXT } from '@/lib/leisure-exporting';

// ─── Palabras comunes a excluir al generar keywords ────────────────────
const STOP_WORDS_ES = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'en', 'con', 'por', 'para', 'que', 'es', 'son', 'ser', 'estar',
  'hay', 'como', 'donde', 'cuando', 'quien', 'cual', 'cual',
  'mas', 'menos', 'muy', 'ya', 'no', 'si', 'ni', 'o', 'y', 'a',
  'su', 'sus', 'mi', 'tu', 'nos', 'les', 'le', 'me', 'te', 'se',
  'al', 'lo', 'esto', 'eso', 'esto', 'aquello', 'todo', 'toda',
  'puede', 'puedo', 'pueden', 'hacer', 'tener', 'saber', 'querer',
  'ir', 'dar', 'ver', 'llegar', 'pasar', 'deber', 'decir', 'traer',
  'por', 'sobre', 'entre', 'hasta', 'desde', 'hacia', 'sin', 'so',
  'pero', 'porque', 'aunque', 'mientras', 'cuanto', 'bien', 'mal',
  'mucha', 'mucho', 'poco', 'cada', 'otro', 'otra', 'mismo', 'misma',
  'este', 'esta', 'ese', 'esa', 'aqui', 'ahi', 'gracias', 'favor',
  'info', 'informacion', 'información', 'pls', 'porfa', 'porfa',
  'algún', 'algun', 'alguien', 'nada', 'algo', 'algo',
  'hay', 'tiene', 'tienen', 'tengo', 'hola', 'buenos', 'dias', 'buenas',
]);

// ─── Auto-generar keywords a partir de una pregunta ─────────────────────
function autoGenerateKeywords(pregunta: string): string[] {
  return pregunta
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS_ES.has(w));
}

// ─── Esquemas de validación ─────────────────────────────────────────────
const createSchema = z.object({
  categoria: z.string().min(1, 'La categoría es requerida'),
  pregunta: z.string().min(2, 'La pregunta debe tener al menos 2 caracteres'),
  respuesta: z.string().min(2, 'La respuesta debe tener al menos 2 caracteres'),
  keywords: z.array(z.string()).optional(),
  activa: z.boolean().optional().default(true),
  prioridad: z.number().int().optional().default(0),
});

const updateSchema = z.object({
  id: z.number().int().positive('ID inválido'),
  categoria: z.string().min(1).optional(),
  pregunta: z.string().min(2).optional(),
  respuesta: z.string().min(2).optional(),
  keywords: z.array(z.string()).optional(),
  activa: z.boolean().optional(),
  prioridad: z.number().int().optional(),
});

// ─── GET /api/ai-knowledge ─────────────────────────────────────────────
// Obtiene todas las entradas. Filtros: ?categoria=X & ?activa=true/false
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const activaParam = searchParams.get('activa');

    const where: Record<string, unknown> = {};

    if (categoria) {
      where.categoria = categoria;
    }

    if (activaParam !== null && activaParam !== '') {
      where.activa = activaParam === 'true';
    }

    const entries = await db.aIKnowledge.findMany({
      where,
      orderBy: [{ prioridad: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ ok: true, data: entries });
  } catch (error) {
    console.error('[AI Knowledge] Error al obtener entradas:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al obtener entradas de conocimiento' },
      { status: 500 }
    );
  }
}

// ─── POST /api/ai-knowledge ────────────────────────────────────────────
// Crea nueva entrada. Si no se proveen keywords se autogeneran.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── ¿Es un test? ────────────────────────────────────────────────
    if (body.test === true) {
      return handleTest(body);
    }

    const validated = createSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { ok: false, error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { categoria, pregunta, respuesta, keywords, activa, prioridad } =
      validated.data;

    const finalKeywords =
      keywords && keywords.length > 0 ? keywords : autoGenerateKeywords(pregunta);

    const entry = await db.aIKnowledge.create({
      data: {
        categoria,
        pregunta,
        respuesta,
        keywords: finalKeywords,
        activa,
        prioridad,
      },
    });

    return NextResponse.json({ ok: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('[AI Knowledge] Error al crear entrada:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al crear entrada de conocimiento' },
      { status: 500 }
    );
  }
}

// ─── PUT /api/ai-knowledge ─────────────────────────────────────────────
// Actualiza entrada existente.
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = updateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { ok: false, error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, ...updateData } = validated.data;

    const existing = await db.aIKnowledge.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Entrada no encontrada' },
        { status: 404 }
      );
    }

    // ── Datos de actualización ───────────────────────────────────────
    const data: Record<string, unknown> = {};
    if (updateData.categoria !== undefined) data.categoria = updateData.categoria;
    if (updateData.pregunta !== undefined) data.pregunta = updateData.pregunta;
    if (updateData.respuesta !== undefined) data.respuesta = updateData.respuesta;
    if (updateData.keywords !== undefined) data.keywords = updateData.keywords;
    if (updateData.activa !== undefined) data.activa = updateData.activa;
    if (updateData.prioridad !== undefined) data.prioridad = updateData.prioridad;

    // Si se cambia la pregunta pero no los keywords, autogenerar
    if (updateData.pregunta && !updateData.keywords) {
      data.keywords = autoGenerateKeywords(updateData.pregunta);
    }

    const entry = await db.aIKnowledge.update({
      where: { id },
      data,
    });

    return NextResponse.json({ ok: true, data: entry });
  } catch (error) {
    console.error('[AI Knowledge] Error al actualizar entrada:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al actualizar entrada de conocimiento' },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/ai-knowledge?id=X ─────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      return NextResponse.json(
        { ok: false, error: 'El parámetro "id" es requerido' },
        { status: 400 }
      );
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const existing = await db.aIKnowledge.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Entrada no encontrada' },
        { status: 404 }
      );
    }

    await db.aIKnowledge.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      data: { message: 'Entrada eliminada correctamente' },
    });
  } catch (error) {
    console.error('[AI Knowledge] Error al eliminar entrada:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al eliminar entrada de conocimiento' },
      { status: 500 }
    );
  }
}

// ─── POST /api/ai-knowledge  (test=true) ───────────────────────────────
// Prueba la base de conocimiento con una pregunta del usuario.
async function handleTest(body: { pregunta: string }) {
  try {
    const { pregunta } = body;

    if (!pregunta || typeof pregunta !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'La pregunta es requerida para el test' },
        { status: 400 }
      );
    }

    // ── Normalizar pregunta para buscar ──────────────────────────────
    const normalizedQ = pregunta
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const questionWords = normalizedQ
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    // ── Buscar en la base de conocimiento ────────────────────────────
    const allEntries = await db.aIKnowledge.findMany({
      where: { activa: true },
      orderBy: [{ prioridad: 'desc' }, { createdAt: 'desc' }],
    });

    // ── Calcular relevancia por coincidencia de keywords ─────────────
    const scored = allEntries.map((entry) => {
      const entryKeywords = entry.keywords.map((k) =>
        k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      );
      const entryPregunta = entry.pregunta
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      let score = 0;

      // Coincidencia de keywords con palabras de la pregunta
      for (const kw of entryKeywords) {
        if (kw && kw.length > 1) {
          for (const qw of questionWords) {
            if (qw === kw || qw.includes(kw) || kw.includes(qw)) {
              score += 2;
            }
          }
        }
      }

      // Coincidencia directa de categoría
      for (const qw of questionWords) {
        if (
          entry.categoria
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .includes(qw)
        ) {
          score += 1;
        }
      }

      // Bonus por prioridad
      score += entry.prioridad * 0.1;

      return { entry, score };
    });

    // Ordenar por score descendente, filtrar los que tienen match
    const matched = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => s.entry);

    // ── Construir contexto para la IA ────────────────────────────────
    let knowledgeContext = '';
    if (matched.length > 0) {
      knowledgeContext = matched
        .map(
          (m) =>
            `Pregunta frecuente: ${m.pregunta}\nRespuesta: ${m.respuesta}`
        )
        .join('\n\n');
    }

    // ── Llamar a la IA con el contexto ───────────────────────────────
    let aiResponse = '';
    try {
      const systemPrompt = `${BUSINESS_CONTEXT}\n\n${
        knowledgeContext
          ? `INFORMACIÓN DE LA BASE DE CONOCIMIENTO (usa esta información para responder si es relevante):\n\n${knowledgeContext}\n\nResponde basándote en la información anterior si es aplicable.`
          : 'No hay información específica en la base de conocimiento para esta pregunta. Responde de forma general.'
      }`;

      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: pregunta },
        ],
      });

      aiResponse =
        completion.choices?.[0]?.message?.content ||
        'No se pudo generar una respuesta.';
    } catch (aiErr) {
      console.error('[AI Knowledge Test] Error de IA:', aiErr);
      aiResponse =
        matched.length > 0
          ? matched[0].respuesta
          : 'Lo siento, no encontré información relevante para tu pregunta.';
    }

    return NextResponse.json({
      ok: true,
      data: {
        pregunta,
        matchedEntries: matched,
        matchCount: matched.length,
        aiResponse,
      },
    });
  } catch (error) {
    console.error('[AI Knowledge] Error en test:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al probar la base de conocimiento' },
      { status: 500 }
    );
  }
}
