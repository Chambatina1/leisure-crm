import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'crypto';

/** Llamada de una tarea programada de Render (cabecera x-cron-secret = CRON_SECRET). */
export function esCron(request: NextRequest): boolean {
  const esperado = process.env.CRON_SECRET;
  const recibido = request.headers.get('x-cron-secret') || '';
  if (!esperado || esperado.length < 16 || !recibido) return false;
  const a = Buffer.from(esperado);
  const b = Buffer.from(recibido);
  return a.length === b.length && timingSafeEqual(a, b);
}
