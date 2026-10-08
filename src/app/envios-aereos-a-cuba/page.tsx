import type { Metadata } from 'next';
import { SeoPage } from '@/components/ambitosmax/seo-page';

export const metadata: Metadata = {
  title: "Envíos Aéreos a Cuba — La Opción Más Rápida",
  description: "Tu paquete en Cuba en 3-7 días hábiles",
  alternates: { canonical: '/envios-aereos-a-cuba' },
  openGraph: { url: '/envios-aereos-a-cuba', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Ambitosmax' }], title: "Envíos Aéreos a Cuba — La Opción Más Rápida", description: "Tu paquete en Cuba en 3-7 días hábiles", type: 'website', siteName: 'Ambitosmax', locale: 'es_US' },
};

export default function Page() {
  return (
    <SeoPage
      ruta="/envios-aereos-a-cuba"
      titulo="Envíos Aéreos a Cuba — La Opción Más Rápida"
      subtitulo="Tu paquete en Cuba en 3-7 días hábiles"
      descripcion="Cuando la urgencia importa, el envío aéreo es tu mejor opción. Perfecto para medicamentos, documentos, alimentos no perecederos y artículos urgentes. Llegada garantizada en 3-7 días hábiles."
      beneficios={['Entrega en 3-7 días hábiles', 'Ideal para artículos urgentes', 'Medicamentos y documentos', 'Tracking en tiempo real', 'Salidas semanales', 'Perfecto para alimentos']}
      faqs={[{q: '¿Qué puedo enviar por aire?', a: 'Medicamentos, documentos, alimentos no perecederos, ropa y artículos pequeños.'}, {q: '¿Hay límite de peso?', a: 'El límite por bulto aéreo es de 70 libras.'}]}
    />
  );
}
