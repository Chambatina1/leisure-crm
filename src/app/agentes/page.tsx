import type { Metadata } from 'next';
import { SeoPage } from '@/components/ambitosmax/seo-page';
import { getCurrentView } from '@/components/ambitosmax/seo-helpers';

export const metadata: Metadata = {
  title: "Agentes de Ambitosmax — Nuestra Red en Cuba",
  description: "Conoce nuestros agentes y agencias en toda la isla",
};

export default function Page() {
  return (
    <SeoPage
      titulo="Agentes de Ambitosmax — Nuestra Red en Cuba"
      subtitulo="Conoce nuestros agentes y agencias en toda la isla"
      descripcion="Nuestra red de agentes cubre toda Cuba con agencias en La Habana, Matanzas, Villa Clara, Camagüey, Holguín y más. Cada agente está autorizado y certificado."
      beneficios={['Cobertura en toda Cuba', 'Agentes certificados', 'Recogida local disponible', 'Atención en tu provincia', 'Red en crecimiento constante']}
      faqs={[{q: '¿Hay agente en mi provincia?', a: 'Cubrimos las 15 provincias de Cuba. Contáctanos para conocer el agente más cercano.'}]}
    />
  );
}
