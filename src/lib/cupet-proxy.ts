// Puente servidor→gateway CUPET (la clave NUNCA llega al navegador)
const PROXY_URL = process.env.CUPET_PROXY_URL || 'https://45.77.115.60:8443';
const KEY = process.env.CUPET_INTERNAL_KEY;

export async function cupetGet(ruta: string): Promise<Response> {
  if (!KEY) {
    return Response.json(
      { ok: false, error: 'CUPET_INTERNAL_KEY no configurada en el servidor' },
      { status: 503 }
    );
  }
  const r = await fetch(`${PROXY_URL}${ruta}`, {
    headers: { 'x-internal-key': KEY },
    // certificado propio del gateway:
    cache: 'no-store',
  }).catch(() => null);
  if (!r) {
    return Response.json({ ok: false, error: 'Gateway CUPET inalcanzable' }, { status: 502 });
  }
  return new Response(r.body, { status: r.status, headers: { 'Content-Type': 'application/json' } });
}

export async function cupetPost(ruta: string, body: unknown): Promise<Response> {
  if (!KEY) {
    return Response.json(
      { ok: false, error: 'CUPET_INTERNAL_KEY no configurada en el servidor' },
      { status: 503 }
    );
  }
  const r = await fetch(`${PROXY_URL}${ruta}`, {
    method: 'POST',
    headers: { 'x-internal-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  }).catch(() => null);
  if (!r) {
    return Response.json({ ok: false, error: 'Gateway CUPET inalcanzable' }, { status: 502 });
  }
  return new Response(r.body, { status: r.status, headers: { 'Content-Type': 'application/json' } });
}
