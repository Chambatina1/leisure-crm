import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEFAULTS: Record<string, string> = {
  nombre_negocio: 'Leisure Exporting',
  direccion: '7523 Aloma Ave, Winter Park, FL 32792, Suite 112',
  telefono1: '727-506-1845',
  nombre_contacto1: 'Geo',
  telefono2: '786-784-6421',
  nombre_contacto2: 'Adriana',
  telefono3: '',
  nombre_contacto3: '',
  email: '',
  horario: 'Lunes a Viernes 9:00 AM - 6:00 PM',
  whatsapp: '',
  instagram: '',
  facebook: '',
};

async function getOrCreate(clave: string): Promise<string> {
  const existing = await db.config.findUnique({ where: { clave } });
  if (existing) return existing.valor;
  const val = DEFAULTS[clave] || '';
  await db.config.create({ data: { clave, valor: val } });
  return val;
}

async function setConfig(clave: string, valor: string) {
  const existing = await db.config.findUnique({ where: { clave } });
  if (existing) {
    return db.config.update({ where: { clave }, data: { valor } });
  }
  return db.config.create({ data: { clave, valor } });
}

// GET /api/config - Returns all config (or specific keys)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keys = searchParams.get('keys');

    if (keys) {
      const keyList = keys.split(',');
      const entries: Record<string, string> = {};
      for (const k of keyList) {
        entries[k.trim()] = await getOrCreate(k.trim());
      }
      return NextResponse.json({ ok: true, data: entries });
    }

    // Return all configs
    const allKeys = Object.keys(DEFAULTS);
    const entries: Record<string, string> = {};
    for (const k of allKeys) {
      entries[k] = await getOrCreate(k);
    }
    return NextResponse.json({ ok: true, data: entries });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener configuración' }, { status: 500 });
  }
}

// POST /api/config - Update config values
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configs } = body;

    if (!configs || typeof configs !== 'object') {
      return NextResponse.json({ ok: false, error: 'Formato inválido. Envía { configs: { clave: valor } }' }, { status: 400 });
    }

    for (const [clave, valor] of Object.entries(configs)) {
      if (DEFAULTS.hasOwnProperty(clave) || clave.startsWith('custom_')) {
        await setConfig(clave, String(valor || ''));
      }
    }

    return NextResponse.json({ ok: true, mensaje: 'Configuración guardada correctamente' });
  } catch (error) {
    console.error('Error saving config:', error);
    return NextResponse.json({ ok: false, error: 'Error al guardar configuración' }, { status: 500 });
  }
}
