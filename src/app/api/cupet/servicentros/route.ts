import { cupetGet } from '@/lib/cupet-proxy';

// GET /api/cupet/servicentros — gasolineras CUPET (por el túnel)
export async function GET() {
  return cupetGet('/cupet/servicentros');
}
