// Páginas de aterrizaje para SEO: una fuente para el sitemap y los enlaces internos.
export const SITIO = 'https://ambitosmax.com';

export const PAGINAS_SEO: { url: string; titulo: string; prioridad: number; frecuencia: 'daily' | 'weekly' | 'monthly' }[] = [
  { url: '/balitas-de-gas-en-cuba', titulo: 'Balitas de gas en Cuba', prioridad: 1.0, frecuencia: 'daily' },
  { url: '/gas-para-cuba', titulo: 'Balita de gas para tu familia en La Habana — $85', prioridad: 0.95, frecuencia: 'daily' },
  { url: '/diesel-y-gasolina-en-cuba', titulo: 'Diésel y gasolina en Cuba', prioridad: 1.0, frecuencia: 'daily' },
  { url: '/tienda-cuba', titulo: 'Tienda online para Cuba', prioridad: 0.95, frecuencia: 'daily' },
  { url: '/envios-a-cuba', titulo: 'Envíos a Cuba', prioridad: 0.9, frecuencia: 'weekly' },
  { url: '/paqueteria-a-cuba', titulo: 'Paquetería a Cuba', prioridad: 0.9, frecuencia: 'weekly' },
  { url: '/comprar-para-cuba', titulo: 'Comprar para Cuba', prioridad: 0.9, frecuencia: 'weekly' },
  { url: '/medicamentos-a-cuba', titulo: 'Medicamentos a Cuba', prioridad: 0.9, frecuencia: 'weekly' },
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
    'Balitas de gas, diésel y gasolina en Cuba, tienda online y envíos a Cuba desde Estados Unidos. Recogida en La Habana y entrega en toda la isla.',
  telephone: '+1-727-506-1845',
  areaServed: [{ '@type': 'Country', name: 'Cuba' }, { '@type': 'Country', name: 'United States' }],
  address: {
    '@type': 'PostalAddress',
    streetAddress: '6800 N Florida Ave',
    addressLocality: 'Tampa',
    addressRegion: 'FL',
    postalCode: '33604',
    addressCountry: 'US',
  },
  contactPoint: [
    { '@type': 'ContactPoint', telephone: '+1-727-506-1845', contactType: 'customer service', availableLanguage: ['Spanish', 'English'] },
  ],
};
