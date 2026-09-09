import { cupetGet } from '@/lib/cupet-proxy';

// GET /api/cupet/tipos — tipos de combustible CUPET
export async function GET() {
  return cupetGet('/cupet/tipos');
}
