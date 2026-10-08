import type { Metadata } from 'next';
import { SeoPage } from '@/components/ambitosmax/seo-page';

export const metadata: Metadata = {
  title: "Recogida a Domicilio en Miami — Servicio de Pickup",
  description: "Recogemos tus paquetes en tu casa u oficina",
  alternates: { canonical: '/recogida-a-domicilio' },
  openGraph: { url: '/recogida-a-domicilio', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Ambitosmax' }], title: "Recogida a Domicilio en Miami — Servicio de Pickup", description: "Recogemos tus paquetes en tu casa u oficina", type: 'website', siteName: 'Ambitosmax', locale: 'es_US' },
};

export default function Page() {
  return (
    <SeoPage
      ruta="/recogida-a-domicilio"
      titulo="Recogida a Domicilio en Miami — Servicio de Pickup"
      subtitulo="Recogemos tus paquetes en tu casa u oficina"
      descripcion="No necesitas venir a nuestra oficina. Recogemos tus paquetes a domicilio en Miami y áreas circundantes. Programa tu recogida hoy."
      beneficios={['Recogida en Miami-Dade y Broward', 'Programación online o por WhatsApp', 'Sin costo adicional en zonas cubiertas', 'Recogida el mismo día', 'Lunes a viernes 8AM-5PM', 'Confirmación por mensaje']}
      faqs={[{q: '¿Tiene costo adicional?', a: 'La recogida es gratuita en Miami-Dade. Broward puede tener un cargo mínimo.'}, {q: '¿Cómo programo?', a: 'Contáctanos por WhatsApp al +1 (727) 506-1845 o llámanos.'}]}
    />
  );
}
