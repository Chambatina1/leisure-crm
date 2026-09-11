import type { Metadata } from 'next';
import { SeoPage } from '@/components/ambitosmax/seo-page';
import { getCurrentView } from '@/components/ambitosmax/seo-helpers';

export const metadata: Metadata = {
  title: "Comprar para Cuba — Tienda Online con Entrega",
  description: "Compra online y nosotros lo entregamos en Cuba",
};

export default function Page() {
  return (
    <SeoPage
      titulo="Comprar para Cuba — Tienda Online con Entrega"
      subtitulo="Compra online y nosotros lo entregamos en Cuba"
      descripcion="Con Ambitosmax puedes comprar online desde Estados Unidos y nosotros nos encargamos de todo: envío, aduana y entrega a domicilio en Cuba. Tu familia recibe sin moverse de casa."
      beneficios={['Compra online', 'entrega en Cuba', 'Más de 100 productos disponibles', 'Balas de gas a domicilio', 'Electrodomésticos con garantía', 'Motos entregadas armadas', 'Combustible en gasolineras']}
      faqs={[{q: '¿Cómo funciona?', a: 'Seleccionas los productos, pagas online o por Zelle, y nosotros lo entregamos en la dirección de Cuba.'}, {q: '¿Puedo comprar combustible?', a: 'Sí, vendemos combustible que se carga en gasolineras cubanas con un PIN de seguridad.'}]}
    />
  );
}
