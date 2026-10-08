import { NextRequest, NextResponse } from 'next/server';
import { getCliente } from '@/lib/cliente-auth';

// GET /api/users/me — cliente con sesión (o null)
export async function GET(request: NextRequest) {
  const c = await getCliente(request);
  return NextResponse.json({ ok: true, data: c });
}
