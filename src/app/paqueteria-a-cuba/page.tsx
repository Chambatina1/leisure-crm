import type { Metadata } from 'next';
import { SeoPage } from '@/components/ambitosmax/seo-page';
import { getCurrentView } from '@/components/ambitosmax/seo-helpers';

export const metadata: Metadata = {
  title: "Paquetería a Cuba — Servicio de Paquetes desde EE.UU.",
  description: "Envía paquetes de cualquier tamaño a Cuba con tarifas competitivas",
};

export default function Page() {
  return (
    <SeoPage
      titulo="Paquetería a Cuba — Servicio de Paquetes desde EE.UU."
      subtitulo="Envía paquetes de cualquier tamaño a Cuba con tarifas competitivas"
      descripcion="Nuestro servicio de paquetería a Cuba maneja paquetes de todos los tamaños: desde sobras y cajas pequeñas hasta envíos comerciales. Con tarifas por libra competitivas y garantía de entrega en toda la isla."
      beneficios={['Tarifas por libra competitivas', 'Sin límite de peso', 'Empaque incluido', 'Seguro de envío disponible', 'Aduana manejada por nosotros', 'Entrega en toda Cuba']}
      faqs={[{q: '¿Cuál es la tarifa por libra?', a: 'Nuestras tarifas empiezan desde $4.50 por libra según el destino y tipo de servicio.'}, {q: '¿Hay restricciones?', a: 'Algunos artículos tienen restricciones aduanales. Contáctanos para verificar tu envío.'}]}
    />
  );
}
