import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { qboAppConfigurada, qboConectado, redirectUri } from '@/lib/quickbooks';

// GET /api/quickbooks/estado (admin) — qué falta para usar QuickBooks
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  return NextResponse.json({
    ok: true,
    data: {
      appConfigurada: qboAppConfigurada(),
      conectado: await qboConectado(),
      webhookConfigurado: Boolean(process.env.QBO_WEBHOOK_TOKEN),
      redirectUri: redirectUri(),
      webhookUrl: new URL('/api/quickbooks/webhook', redirectUri()).toString(),
    },
  });
}
