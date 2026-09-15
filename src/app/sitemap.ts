import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://ambitosmax.com';
  const now = new Date();

  const paginas = [
    { url: '', priority: 1.0, freq: 'daily' },
    { url: '/envios-a-cuba', priority: 0.9, freq: 'weekly' },
    { url: '/paqueteria-a-cuba', priority: 0.9, freq: 'weekly' },
    { url: '/envios-maritimos-a-cuba', priority: 0.8, freq: 'weekly' },
    { url: '/envios-aereos-a-cuba', priority: 0.8, freq: 'weekly' },
    { url: '/comprar-para-cuba', priority: 0.9, freq: 'weekly' },
    { url: '/alimentos-para-cuba', priority: 0.8, freq: 'weekly' },
    { url: '/electrodomesticos-para-cuba', priority: 0.8, freq: 'weekly' },
    { url: '/medicamentos-a-cuba', priority: 0.9, freq: 'weekly' },
    { url: '/recogida-a-domicilio', priority: 0.7, freq: 'monthly' },
    { url: '/rastreo', priority: 0.9, freq: 'daily' },
    { url: '/agentes', priority: 0.7, freq: 'monthly' },
    { url: '/hazte-agente', priority: 0.8, freq: 'monthly' },
  ];

  return paginas.map((p) => ({
    url: `${base}${p.url}`,
    lastModified: now,
    changeFrequency: p.freq as 'daily' | 'weekly' | 'monthly',
    priority: p.priority,
  }));
}
