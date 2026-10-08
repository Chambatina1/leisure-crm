import type { Metadata } from 'next';
import { SeoPage } from '@/components/ambitosmax/seo-page';

export const metadata: Metadata = {
  title: "Envíos Marítimos a Cuba — La Opción Más Económica",
  description: "Envía grandes volúmenes por mar con las mejores tarifas",
  alternates: { canonical: '/envios-maritimos-a-cuba' },
  openGraph: { url: '/envios-maritimos-a-cuba', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Ambitosmax' }], title: "Envíos Marítimos a Cuba — La Opción Más Económica", description: "Envía grandes volúmenes por mar con las mejores tarifas", type: 'website', siteName: 'Ambitosmax', locale: 'es_US' },
};

export default function Page() {
  return (
    <SeoPage
      ruta="/envios-maritimos-a-cuba"
      titulo="Envíos Marítimos a Cuba — La Opción Más Económica"
      subtitulo="Envía grandes volúmenes por mar con las mejores tarifas"
      descripcion="El envío marítimo es la opción más económica para enviar a Cuba. Ideal para electrodomésticos, muebles, motos y grandes volúmenes. Tiempo de tránsito: 15-30 días con llegada programada mensual."
      beneficios={['La tarifa más baja por libra', 'Ideal para artículos grandes', 'Salidas programadas mensuales', 'Contenedores dedicados', 'Carga de hasta 70 lb por bulto', 'Seguro de carga disponible']}
      faqs={[{q: '¿Cuánto tarda el envío marítimo?', a: 'Entre 15 y 30 días dependiendo del puerto de llegada y la aduana cubana.'}, {q: '¿Puedo enviar electrodomésticos por mar?', a: 'Sí, el marítimo es ideal para neveras, cocinas, lavadoras y otros electrodomésticos.'}]}
    />
  );
}
