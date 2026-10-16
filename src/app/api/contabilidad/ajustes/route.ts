import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { CLAVE_EMAIL_INFORME, destinatariosInforme } from '@/lib/contabilidad';

// GET/POST /api/contabilidad/ajustes (admin) — correo(s) del informe de los viernes
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, data: { emails: (await destinatariosInforme()).join(', ') } });
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const emails = String(body.emails || '')
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter(Boolean);
  if (!emails.length || emails.some((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) {
    return NextResponse.json({ ok: false, error: 'Escribe uno o más correos válidos' }, { status: 400 });
  }
  const valor = emails.join(', ');
  await db.config.upsert({ where: { clave: CLAVE_EMAIL_INFORME }, update: { valor }, create: { clave: CLAVE_EMAIL_INFORME, valor } });
  return NextResponse.json({ ok: true, data: { emails: valor } });
}
