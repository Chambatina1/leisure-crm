import type { Metadata } from 'next';
import { SeoPage } from '@/components/ambitosmax/seo-page';

export const metadata: Metadata = {
  title: "Agentes de Ambitosmax — Nuestra Red en Cuba",
  description: "Conoce nuestros agentes y agencias en toda la isla",
  alternates: { canonical: '/agentes' },
  openGraph: { url: '/agentes', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Ambitosmax' }], title: "Agentes de Ambitosmax — Nuestra Red en Cuba", description: "Conoce nuestros agentes y agencias en toda la isla", type: 'website', siteName: 'Ambitosmax', locale: 'es_US' },
};

export default function Page() {
  return (
    <SeoPage
      ruta="/agentes"
      titulo="Agentes de Ambitosmax — Nuestra Red en Cuba"
      subtitulo="Conoce nuestros agentes y agencias en toda la isla"
      descripcion="Nuestra red de agentes cubre toda Cuba con agencias en La Habana, Matanzas, Villa Clara, Camagüey, Holguín y más. Cada agente está autorizado y certificado."
      beneficios={['Cobertura en toda Cuba', 'Agentes certificados', 'Recogida local disponible', 'Atención en tu provincia', 'Red en crecimiento constante']}
      faqs={[{q: '¿Hay agente en mi provincia?', a: 'Cubrimos las 15 provincias de Cuba. Contáctanos para conocer el agente más cercano.'}]}
    />
  );
}
