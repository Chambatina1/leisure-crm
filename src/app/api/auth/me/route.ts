import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';

// GET /api/auth/me — ¿la sesión de admin sigue siendo válida?
export async function GET(request: NextRequest) {
  return NextResponse.json({ ok: true, isAdmin: isAdminRequest(request) });
}
