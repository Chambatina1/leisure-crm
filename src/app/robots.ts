import type { MetadataRoute } from 'next';
import { SITIO } from '@/lib/seo-paginas';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || SITIO;
  return {
    rules: [
      {
        userAgent: '*',
        // Las fotos de productos se sirven desde /api/tienda/imagen: deben poder indexarse
        allow: ['/', '/api/tienda/imagen/'],
        disallow: ['/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
