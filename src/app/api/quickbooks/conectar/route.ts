import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { qboAppConfigurada, urlAutorizacion } from '@/lib/quickbooks';

// GET /api/quickbooks/conectar (admin) — lleva a la pantalla de autorización de Intuit
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  if (!qboAppConfigurada()) {
    return NextResponse.json(
      { ok: false, error: 'Faltan QBO_CLIENT_ID y QBO_CLIENT_SECRET en las variables de entorno' },
      { status: 503 }
    );
  }
  return NextResponse.redirect(urlAutorizacion());
}
