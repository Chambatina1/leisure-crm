import type { Metadata } from 'next';
import { SeoPage } from '@/components/ambitosmax/seo-page';
import { getCurrentView } from '@/components/ambitosmax/seo-helpers';

export const metadata: Metadata = {
  title: "Electrodomésticos para Cuba — Neveras, Cocinas y Más",
  description: "Los mejores precios en electrodomésticos con entrega en Cuba",
};

export default function Page() {
  return (
    <SeoPage
      titulo="Electrodomésticos para Cuba — Neveras, Cocinas y Más"
      subtitulo="Los mejores precios en electrodomésticos con entrega en Cuba"
      descripcion="Envía neveras, cocinas, lavadoras, secadoras, ventiladores y más a Cuba. Todos con garantía y entrega a domicilio. Precios desde $250."
      beneficios={['Neveras desde $450', 'Cocinas desde $280', 'Lavadoras desde $380', 'Garantía incluida', 'Entrega a domicilio', 'Hasta 2 por tipo en aduana']}
      faqs={[{q: '¿Cuántos electrodomésticos puedo enviar?', a: 'La aduana cubana permite hasta 2 unidades por tipo de electrodoméstico por envío.'}]}
    />
  );
}
