import { NextResponse } from 'next/server';
import { clearClienteCookie } from '@/lib/cliente-auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearClienteCookie(res);
  return res;
}
