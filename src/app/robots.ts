import type { MetadataRoute } from 'next';
import { SITIO } from '@/lib/seo-paginas';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || SITIO;
  // Sitio de pruebas: que Google no lo indexe nunca
  if (process.env.MODO_PRUEBAS === '1') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [
      {
        userAgent: '*',
        // Las fotos de productos se sirven desde /api/tienda/imagen: deben poder indexarse
        allow: ['/', '/api/tienda/imagen/'],
        disallow: ['/api/', '/admin'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
