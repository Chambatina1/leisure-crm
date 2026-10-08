import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPage } from '@/components/ambitosmax/seo-page';

const T = 'Combustible en Cuba desde EE.UU. — Diésel y gasolina';
const D =
  'Compra diésel y gasolina para tu familia en Cuba desde Estados Unidos. Diésel a $2.37/litro en Servicentro Perla Negra, Bayamo, Granma. Pago por Zelle y PIN de carga.';

export const metadata: Metadata = {
  title: T,
  description: D,
  keywords: ['combustible Cuba', 'diésel Cuba', 'gasolina Cuba', 'comprar combustible para Cuba', 'diésel Bayamo', 'Perla Negra Granma'],
  alternates: { canonical: '/combustible-en-cuba' },
  openGraph: { url: '/combustible-en-cuba', title: T, description: D, type: 'website', siteName: 'Ambitosmax', locale: 'es_US' },
};

export default function Page() {
  return (
    <SeoPage
      ruta="/combustible-en-cuba"
      titulo="Combustible en Cuba: diésel y gasolina"
      subtitulo="Paga desde EE.UU. y tu familiar carga en el servicentro con un PIN"
      descripcion="Con Ambitosmax compras combustible para Cuba desde Estados Unidos. Eliges el servicentro y los litros, pagas por Zelle y, al confirmar el pago, recibes un PIN de carga. El beneficiario presenta su carnet y el PIN en el surtidor. Diésel disponible en Servicentro Perla Negra (Carretera Central vía Las Tunas Km 1 1/2, Bayamo, Granma) a $2.37 USD por litro."
      beneficios={[
        'Diésel a $2.37 USD por litro',
        'Servicentro Perla Negra, Bayamo, Granma',
        'Eliges cuántos litros',
        'PIN de carga para el beneficiario',
        'Pago por Zelle desde EE.UU.',
        'Confirmación por correo',
      ]}
      faqs={[
        { q: '¿Cuánto cuesta el diésel?', a: '$2.37 USD por litro en Servicentro Perla Negra, Bayamo. El precio puede variar según disponibilidad.' },
        { q: '¿Cómo recibe el combustible mi familiar?', a: 'Al confirmar tu pago se genera un PIN. Tu familiar va al servicentro, presenta su carnet de identidad y el PIN en el surtidor.' },
        { q: '¿Dónde está el Servicentro Perla Negra?', a: 'En la Carretera Central vía Las Tunas, Km 1 1/2, municipio Bayamo, provincia Granma.' },
        { q: '¿También venden cilindros de gas?', a: 'Sí: cilindro de gas lleno en La Habana por $85, sin entregar vacío.' },
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
