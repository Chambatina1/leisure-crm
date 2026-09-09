// Puente servidor→gateway CUPET (la clave NUNCA llega al navegador).
// Usa node:https para aceptar el certificado propio del gateway.
import https from 'https';

const PROXY_URL = process.env.CUPET_PROXY_URL || 'https://45.77.115.60:8443';
const KEY = process.env.CUPET_INTERNAL_KEY;

function llamar(metodo: string, ruta: string, cuerpo?: unknown): Promise<Response> {
  if (!KEY) {
    return Promise.resolve(
      Response.json({ ok: false, error: 'CUPET_INTERNAL_KEY no configurada en el servidor' }, { status: 503 })
    );
  }
  const url = new URL(PROXY_URL + ruta);
  const datos = cuerpo ? JSON.stringify(cuerpo) : null;

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: metodo,
        rejectUnauthorized: false, // certificado propio del gateway (clave viaja en header)
        timeout: 25000,
        headers: {
          'x-internal-key': KEY,
          ...(datos
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(datos) }
            : {}),
        },
      },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () =>
          resolve(new Response(buf, {
            status: res.statusCode || 502,
            headers: { 'Content-Type': 'application/json' },
          }))
        );
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve(Response.json({ ok: false, error: 'Gateway CUPET sin respuesta (timeout)' }, { status: 504 }));
    });
    req.on('error', (e) =>
      resolve(Response.json({ ok: false, error: `Gateway CUPET inalcanzable: ${String(e.message).slice(0, 80)}` }, { status: 502 }))
    );
    if (datos) req.write(datos);
    req.end();
  });
}

export const cupetGet = (ruta: string) => llamar('GET', ruta);
export const cupetPost = (ruta: string, body: unknown) => llamar('POST', ruta, body);
