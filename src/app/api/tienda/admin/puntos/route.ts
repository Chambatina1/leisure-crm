import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireTienda } from '@/lib/admin-auth';
import { guardarPuntos, leerPuntos } from '@/lib/puntos-recogida';

const puntosSchema = z
  .array(
    z.object({
      id: z.string().max(60).optional().or(z.literal('')),
      nombre: z.string().trim().min(2, 'Cada punto necesita un nombre').max(80),
      lugar: z.string().trim().max(120).optional().default(''),
      activo: z.boolean().optional().default(true),
    })
  )
  .max(30);

const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'punto';

// GET /api/tienda/admin/puntos — todos los puntos de recogida
export async function GET(request: NextRequest) {
  const denied = requireTienda(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, data: await leerPuntos() });
}

// PUT /api/tienda/admin/puntos — guarda la lista completa
export async function PUT(request: NextRequest) {
  const denied = requireTienda(request);
  if (denied) return denied;
  try {
    const validated = puntosSchema.safeParse(await request.json());
    if (!validated.success) {
      const msg = validated.error.issues[0]?.message || 'Datos no válidos';
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
    // Los puntos ya existentes conservan su id; los nuevos lo sacan del nombre
    const usados = new Set<string>();
    const puntos = validated.data.map((p) => {
      let id = p.id || slug(p.nombre);
      for (let n = 2; usados.has(id); n++) id = `${slug(p.nombre)}-${n}`;
      usados.add(id);
      return { id, nombre: p.nombre, lugar: p.lugar || '', activo: p.activo };
    });
    await guardarPuntos(puntos);
    return NextResponse.json({ ok: true, data: puntos });
  } catch (error) {
    console.error('Error guardando puntos de recogida:', error);
    return NextResponse.json({ ok: false, error: 'Error al guardar puntos' }, { status: 500 });
  }
}
