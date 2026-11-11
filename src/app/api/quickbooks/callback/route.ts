import { NextRequest, NextResponse } from 'next/server';
import { completarConexion, estadoValido, redirectUri } from '@/lib/quickbooks';

// GET /api/quickbooks/callback — Intuit vuelve aquí tras autorizar la empresa
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const volver = (estado: string) => NextResponse.redirect(new URL(`/?qbo=${estado}`, redirectUri()));
  const code = p.get('code') || '';
  const realmId = p.get('realmId') || '';
  if (p.get('error') || !code || !realmId) return volver('cancelado');
  if (!estadoValido(p.get('state') || '')) return volver('caducado');
  try {
    await completarConexion(code, realmId);
    return volver('conectado');
  } catch (e) {
    console.error('[qbo] Error al conectar:', e instanceof Error ? e.message : e);
    return volver('error');
  }
}
