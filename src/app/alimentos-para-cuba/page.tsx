import type { Metadata } from 'next';
import { SeoPage } from '@/components/ambitosmax/seo-page';

export const metadata: Metadata = {
  title: "Alimentos para Cuba — Envía Comida a Tu Familia",
  description: "Desde misceláneas hasta paquetes de comida completa",
  alternates: { canonical: '/alimentos-para-cuba' },
  openGraph: { url: '/alimentos-para-cuba', title: "Alimentos para Cuba — Envía Comida a Tu Familia", description: "Desde misceláneas hasta paquetes de comida completa", type: 'website', siteName: 'Ambitosmax', locale: 'es_US' },
};

export default function Page() {
  return (
    <SeoPage
      ruta="/alimentos-para-cuba"
      titulo="Alimentos para Cuba — Envía Comida a Tu Familia"
      subtitulo="Desde misceláneas hasta paquetes de comida completa"
      descripcion="Envía alimentos a Cuba fácilmente. Tenemos desde misceláneas y canastas familiares hasta productos específicos. Todos los alimentos llegan frescos y en perfect estado."
      beneficios={['Misceláneas desde $10', 'Canastas familiares disponibles', 'Productos no perecederos', 'Envío aéreo o marítimo', 'Entrega a domicilio', 'Empaque sellado']}
      faqs={[{q: '¿Qué alimentos puedo enviar?', a: 'Productos no perecedores: arroz, aceite, enlatados, snacks, misceláneas y más.'}]}
    />
  );
}
