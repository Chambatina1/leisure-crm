import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

// ═══════════════════════════════════════════════════════════════
// POST /api/tienda/importar  (admin)  { url }
// Lee un link de Amazon o TikTok y devuelve nombre, descripción,
// precio de referencia e imagen para rellenar el formulario de
// producto. NO guarda nada: el admin revisa, pone su precio y guarda.
// ═══════════════════════════════════════════════════════════════

const HOSTS_PERMITIDOS = [
  /(^|\.)amazon\.[a-z.]+$/i,
  /^a\.co$/i,
  /^amzn\.(to|eu|asia)$/i,
  /(^|\.)tiktok\.com$/i,
];

const MAX_HTML = 3 * 1024 * 1024;
const MAX_IMG = 3 * 1024 * 1024;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function hostPermitido(u: URL): boolean {
  return u.protocol === 'https:' && HOSTS_PERMITIDOS.some((r) => r.test(u.hostname));
}

/** fetch siguiendo redirecciones a mano, comprobando el host en cada salto. */
async function traer(url: string, accept: string): Promise<Response> {
  let actual = new URL(url);
  for (let i = 0; i < 6; i++) {
    if (!hostPermitido(actual) && !/(^|\.)(media-amazon|ssl-images-amazon|tiktokcdn(-us)?|ibyteimg|tiktokcdn-eu)\.com$/i.test(actual.hostname)) {
      throw new Error('HOST_NO_PERMITIDO');
    }
    const r = await fetch(actual, {
      redirect: 'manual',
      headers: { 'User-Agent': UA, Accept: accept, 'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8' },
      signal: AbortSignal.timeout(15000),
    });
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
      actual = new URL(r.headers.get('location')!, actual);
      continue;
    }
    return r;
  }
  throw new Error('DEMASIADAS_REDIRECCIONES');
}

async function leerTexto(r: Response, max: number): Promise<string> {
  const buf = await r.arrayBuffer();
  return new TextDecoder().decode(buf.byteLength > max ? buf.slice(0, max) : buf);
}

const decodificar = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function meta(html: string, prop: string): string | null {
  const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, 'i');
  const m = html.match(re1) || html.match(re2);
  return m ? decodificar(m[1]) : null;
}

function precioDeTexto(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = String(t).replace(/,/g, '').match(/(\d+(?:\.\d{1,2})?)/);
  const n = m ? parseFloat(m[1]) : NaN;
  return Number.isFinite(n) && n > 0 && n < 100000 ? n : null;
}

interface Datos { nombre: string | null; descripcion: string | null; precio: number | null; imagen: string | null }

function desdeJsonLd(html: string): Partial<Datos> {
  const bloques = html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi);
  for (const b of bloques) {
    try {
      const raw = JSON.parse(b[1]);
      const lista = Array.isArray(raw) ? raw : raw['@graph'] ? raw['@graph'] : [raw];
      for (const it of lista) {
        if (!it || !/Product/i.test(String(it['@type']))) continue;
        const oferta = Array.isArray(it.offers) ? it.offers[0] : it.offers;
        const img = Array.isArray(it.image) ? it.image[0] : it.image;
        return {
          nombre: it.name ? decodificar(String(it.name)) : null,
          descripcion: it.description ? decodificar(String(it.description)) : null,
          precio: precioDeTexto(oferta?.price ?? oferta?.lowPrice),
          imagen: typeof img === 'string' ? img : img?.url ?? null,
        };
      }
    } catch {
      /* JSON-LD inválido: seguir */
    }
  }
  return {};
}

function desdeAmazon(html: string): Partial<Datos> {
  const titulo = html.match(/id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i)?.[1];
  const precio =
    html.match(/class=["']a-offscreen["'][^>]*>\s*([^<]+)</i)?.[1] ||
    html.match(/"priceAmount"\s*:\s*([\d.]+)/i)?.[1];
  const imagen =
    html.match(/data-old-hires=["']([^"']+)["']/i)?.[1] ||
    html.match(/"hiRes"\s*:\s*"([^"]+)"/i)?.[1] ||
    html.match(/id=["']landingImage["'][^>]+src=["']([^"']+)["']/i)?.[1];
  const vinetas = [...html.matchAll(/<li[^>]*>\s*<span class=["']a-list-item["'][^>]*>([\s\S]*?)<\/span>/gi)]
    .map((m) => decodificar(m[1].replace(/<[^>]+>/g, '')))
    .filter((t) => t.length > 15 && t.length < 300)
    .slice(0, 3);
  return {
    nombre: titulo ? decodificar(titulo.replace(/<[^>]+>/g, '')) : null,
    precio: precioDeTexto(precio),
    imagen: imagen || null,
    descripcion: vinetas.length ? vinetas.join(' • ') : null,
  };
}

async function imagenComoDataUrl(url: string): Promise<string | null> {
  try {
    const r = await traer(url, 'image/*');
    if (!r.ok) return null;
    const tipo = (r.headers.get('content-type') || '').split(';')[0];
    if (!/^image\/(jpeg|png|webp|gif)$/.test(tipo)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_IMG) return null;
    return `data:${tipo};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  let url: URL;
  try {
    const body = await request.json();
    url = new URL(String(body.url || '').trim());
  } catch {
    return NextResponse.json({ ok: false, error: 'Pega un link válido' }, { status: 400 });
  }
  if (!hostPermitido(url)) {
    return NextResponse.json(
      { ok: false, error: 'Solo se aceptan links de Amazon o TikTok (https)' },
      { status: 400 }
    );
  }

  try {
    const r = await traer(url.toString(), 'text/html');
    const urlFinal = r.url || url.toString();
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: `La página respondió ${r.status}. Rellena los datos a mano.` },
        { status: 502 }
      );
    }
    const html = await leerTexto(r, MAX_HTML);
    if (/captcha|robot check|validateCaptcha/i.test(html) && !/productTitle/i.test(html)) {
      return NextResponse.json(
        { ok: false, error: 'Amazon pidió verificación anti-robots. Inténtalo de nuevo o rellena a mano.' },
        { status: 502 }
      );
    }

    const ld = desdeJsonLd(html);
    const az = /amazon\./i.test(url.hostname) || /amzn|a\.co/i.test(url.hostname) ? desdeAmazon(html) : {};

    const datos: Datos = {
      nombre: az.nombre || ld.nombre || meta(html, 'og:title') || meta(html, 'twitter:title'),
      descripcion: az.descripcion || ld.descripcion || meta(html, 'og:description') || meta(html, 'description'),
      precio:
        az.precio ??
        ld.precio ??
        precioDeTexto(meta(html, 'product:price:amount') || meta(html, 'og:price:amount')),
      imagen: az.imagen || ld.imagen || meta(html, 'og:image') || meta(html, 'twitter:image'),
    };

    if (!datos.nombre && !datos.imagen) {
      return NextResponse.json(
        { ok: false, error: 'No se pudieron leer los datos de ese link. Rellénalos a mano.' },
        { status: 422 }
      );
    }

    const imagenUrl = datos.imagen ? await imagenComoDataUrl(datos.imagen) : null;
    const nombre = (datos.nombre || '').replace(/\s*[|:-]\s*(Amazon\.com|TikTok( Shop)?).*$/i, '').slice(0, 200);

    return NextResponse.json({
      ok: true,
      data: {
        nombre,
        descripcion: (datos.descripcion || '').slice(0, 600),
        precioReferencia: datos.precio, // precio en la tienda de origen (orientativo)
        imagenUrl,
        tiktokUrl: url.toString(),
        origen: /tiktok/i.test(url.hostname) ? 'tiktok' : 'amazon',
        urlFinal,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    console.error('[Tienda importar] Error:', msg);
    return NextResponse.json(
      { ok: false, error: 'No se pudo abrir el link. Rellena los datos a mano.' },
      { status: 502 }
    );
  }
}
