import type { Metadata } from 'next';
import { SeoPage } from '@/components/ambitosmax/seo-page';

export const metadata: Metadata = {
  title: "Medicamentos a Cuba — Envío Rápido y Seguro",
  description: "Envía medicamentos con nuestro servicio aéreo prioritario",
  alternates: { canonical: '/medicamentos-a-cuba' },
  openGraph: { url: '/medicamentos-a-cuba', title: "Medicamentos a Cuba — Envío Rápido y Seguro", description: "Envía medicamentos con nuestro servicio aéreo prioritario", type: 'website', siteName: 'Ambitosmax', locale: 'es_US' },
};

export default function Page() {
  return (
    <SeoPage
      ruta="/medicamentos-a-cuba"
      titulo="Medicamentos a Cuba — Envío Rápido y Seguro"
      subtitulo="Envía medicamentos con nuestro servicio aéreo prioritario"
      descripcion="El envío de medicamentos a Cuba es prioritario para nosotros. Usamos servicio aéreo para garantizar la llegada rápida. Manejamos todos los requisitos aduanales."
      beneficios={['Servicio aéreo prioritario', '3-5 días hábiles', 'Requisitos aduanales manejados', 'Empaque seguro', 'Medicamentos con receta', 'Suplementos y vitaminas']}
      faqs={[{q: '¿Necesito receta médica?', a: 'Algunos medicamentos requieren receta. Los de venta libre no necesitan documentación especial.'}]}
    />
  );
}
