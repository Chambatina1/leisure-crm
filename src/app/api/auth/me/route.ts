import { NextRequest, NextResponse } from 'next/server';
import { rolDeSesion } from '@/lib/admin-auth';

// GET /api/auth/me — ¿la sesión de admin sigue siendo válida? rol: 'admin' | 'tienda' | null
export async function GET(request: NextRequest) {
  const rol = rolDeSesion(request);
  return NextResponse.json({ ok: true, isAdmin: rol === 'admin', rol });
}
