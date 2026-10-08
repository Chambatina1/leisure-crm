import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPage } from '@/components/ambitosmax/seo-page';

const T = 'Diésel y gasolina en Cuba — Compra combustible desde EE.UU.';
const D =
  'Diésel y gasolina en Cuba: compra combustible para tu familia desde Estados Unidos. Diésel a $2.37/litro en Servicentro Perla Negra, Bayamo, Granma. Pago por Zelle y PIN de carga.';

export const metadata: Metadata = {
  title: T,
  description: D,
  keywords: ['diésel y gasolina en Cuba', 'diésel en Cuba', 'gasolina en Cuba', 'combustible en Cuba', 'comprar gasolina para Cuba', 'comprar diésel para Cuba', 'diésel Bayamo', 'Perla Negra Granma'],
  alternates: { canonical: '/diesel-y-gasolina-en-cuba' },
  openGraph: { url: '/diesel-y-gasolina-en-cuba', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Ambitosmax' }], title: T, description: D, type: 'website', siteName: 'Ambitosmax', locale: 'es_US' },
};

export default function Page() {
  return (
    <SeoPage
      ruta="/diesel-y-gasolina-en-cuba"
      titulo="Diésel y gasolina en Cuba"
      subtitulo="Paga desde EE.UU. y tu familiar carga en el servicentro con un PIN"
      descripcion="Compra diésel y gasolina en Cuba para tu familia desde Estados Unidos con Ambitosmax. Eliges el servicentro y los litros, pagas por Zelle y, al confirmar el pago, recibes un PIN de carga. El beneficiario presenta su carnet y el PIN en el surtidor. Diésel disponible en Servicentro Perla Negra (Carretera Central vía Las Tunas Km 1 1/2, Bayamo, Granma) a $2.37 USD por litro."
      beneficios={[
        'Diésel a $2.37 USD por litro',
        'Servicentro Perla Negra, Bayamo, Granma',
        'Eliges cuántos litros',
        'PIN de carga para el beneficiario',
        'Pago por Zelle desde EE.UU.',
        'Confirmación por correo',
      ]}
      faqs={[
        { q: '¿Venden gasolina además de diésel?', a: 'Sí. Según la disponibilidad de cada servicentro hay gasolina regular y especial; los precios por litro se muestran al comprar.' },
        { q: '¿Cuánto cuesta el diésel?', a: '$2.37 USD por litro en Servicentro Perla Negra, Bayamo. El precio puede variar según disponibilidad.' },
        { q: '¿Cómo recibe el combustible mi familiar?', a: 'Al confirmar tu pago se genera un PIN. Tu familiar va al servicentro, presenta su carnet de identidad y el PIN en el surtidor.' },
        { q: '¿Dónde está el Servicentro Perla Negra?', a: 'En la Carretera Central vía Las Tunas, Km 1 1/2, municipio Bayamo, provincia Granma.' },
        { q: '¿También venden balitas de gas?', a: 'Sí: balita (cilindro) de gas llena en La Habana por $85, sin entregar la vacía.' },
      ]}
    >
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-12 text-center">
        <p className="text-sm font-bold text-amber-900 uppercase tracking-wide">Diésel · Perla Negra, Bayamo</p>
        <p className="text-4xl font-black text-[#071a46] mt-1">$2.37 <span className="text-lg">USD / litro</span></p>
        <Link href="/?v=combustible" className="inline-block mt-4 bg-[#55b949] hover:bg-[#3f9a35] text-white font-bold px-8 py-3 rounded-md">
          Comprar combustible
        </Link>
      </div>
    </SeoPage>
  );
}
