// Páginas de aterrizaje para SEO: una fuente para el sitemap y los enlaces internos.
export const SITIO = 'https://ambitosmax.com';

export const PAGINAS_SEO: { url: string; titulo: string; prioridad: number; frecuencia: 'daily' | 'weekly' | 'monthly' }[] = [
  { url: '/cilindro-de-gas-la-habana', titulo: 'Cilindro de gas en La Habana', prioridad: 1.0, frecuencia: 'daily' },
  { url: '/combustible-en-cuba', titulo: 'Combustible en Cuba (diésel y gasolina)', prioridad: 1.0, frecuencia: 'daily' },
  { url: '/tienda-cuba', titulo: 'Tienda online para Cuba', prioridad: 0.95, frecuencia: 'daily' },
  { url: '/envios-a-cuba', titulo: 'Envíos a Cuba', prioridad: 0.9, frecuencia: 'weekly' },
  { url: '/paqueteria-a-cuba', titulo: 'Paquetería a Cuba', prioridad: 0.9, frecuencia: 'weekly' },
  { url: '/comprar-para-cuba', titulo: 'Comprar para Cuba', prioridad: 0.9, frecuencia: 'weekly' },
  { url: '/medicamentos-a-cuba', titulo: 'Medicamentos a Cuba', prioridad: 0.9, frecuencia: 'weekly' },
  { url: '/rastreo', titulo: 'Rastreo de envíos', prioridad: 0.9, frecuencia: 'daily' },
  { url: '/envios-maritimos-a-cuba', titulo: 'Envíos marítimos a Cuba', prioridad: 0.8, frecuencia: 'weekly' },
  { url: '/envios-aereos-a-cuba', titulo: 'Envíos aéreos a Cuba', prioridad: 0.8, frecuencia: 'weekly' },
  { url: '/alimentos-para-cuba', titulo: 'Alimentos para Cuba', prioridad: 0.8, frecuencia: 'weekly' },
  { url: '/electrodomesticos-para-cuba', titulo: 'Electrodomésticos para Cuba', prioridad: 0.8, frecuencia: 'weekly' },
  { url: '/hazte-agente', titulo: 'Hazte agente', prioridad: 0.7, frecuencia: 'monthly' },
  { url: '/agentes', titulo: 'Agentes', prioridad: 0.6, frecuencia: 'monthly' },
  { url: '/recogida-a-domicilio', titulo: 'Recogida a domicilio', prioridad: 0.7, frecuencia: 'monthly' },
];

/** Datos estructurados de la empresa (schema.org) para Google. */
export const ORGANIZACION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITIO}/#organizacion`,
  name: 'Ambitosmax',
  url: SITIO,
  logo: `${SITIO}/icon-512.png`,
  description:
    'Cilindros de gas, combustible, tienda online y envíos a Cuba desde Estados Unidos. Recogida en La Habana y entrega en toda la isla.',
  telephone: '+1-727-506-1845',
  areaServed: [{ '@type': 'Country', name: 'Cuba' }, { '@type': 'Country', name: 'United States' }],
  address: { '@type': 'PostalAddress', addressRegion: 'FL', addressCountry: 'US' },
  contactPoint: [
    { '@type': 'ContactPoint', telephone: '+1-727-506-1845', contactType: 'customer service', availableLanguage: ['Spanish', 'English'] },
  ],
};
