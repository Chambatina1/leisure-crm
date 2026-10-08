import type { MetadataRoute } from 'next';
import { PAGINAS_SEO, SITIO } from '@/lib/seo-paginas';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || SITIO;
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    ...PAGINAS_SEO.map((p) => ({
      url: `${base}${p.url}`,
      lastModified: now,
      changeFrequency: p.frecuencia,
      priority: p.prioridad,
    })),
  ];
}
