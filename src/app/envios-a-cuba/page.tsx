import type { Metadata } from 'next';
import { SeoPage } from '@/components/ambitosmax/seo-page';
import { getCurrentView } from '@/components/ambitosmax/seo-helpers';

export const metadata: Metadata = {
  title: "Envíos a Cuba desde Miami — Rápidos y Seguros",
  description: "Envía paquetes, comida, electrodomésticos y más a tu familia en Cuba con garantía de entrega",
};

export default function Page() {
  return (
    <SeoPage
      titulo="Envíos a Cuba desde Miami — Rápidos y Seguros"
      subtitulo="Envía paquetes, comida, electrodomésticos y más a tu familia en Cuba con garantía de entrega"
      descripcion="Ambitosmax es tu agencia de envíos a Cuba desde Miami. Ofrecemos envíos marítimos y aéreos con garantía de entrega en toda la isla. Desde balas de gas hasta motos, enviamos todo lo que tu familia necesita. Nuestro servicio incluye recogida a domicilio, tracking en tiempo real y entrega garantizada."
      beneficios={['Garantía de entrega en toda Cuba', 'Envíos marítimos y aéreos disponibles', 'Tracking en tiempo real de cada paquete', 'Recogida a domicilio en Miami', 'Entrega a domicilio en Cuba', 'Atención al cliente en español 24/7']}
      faqs={[{q: '¿Cuánto tarda un envío a Cuba?', a: 'Los envíos marítimos tardan entre 15-30 días. Los envíos aéreos entre 3-7 días hábiles.'}, {q: '¿Qué puedo enviar a Cuba?', a: 'Puedes enviar alimentos, electrodomésticos, ropa, medicamentos, balas de gas, motos y más.'}, {q: '¿Cómo rastreo mi envío?', a: 'Usa nuestro rastreador online con tu número CPK para ver el estado en tiempo real.'}]}
    />
  );
}
