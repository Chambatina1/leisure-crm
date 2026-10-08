import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPage } from '@/components/ambitosmax/seo-page';
import { SITIO } from '@/lib/seo-paginas';

const T = 'Cilindro de gas lleno en La Habana — $85 sin entregar vacío';
const D =
  'Compra desde EE.UU. un cilindro de gas lleno para tu familia en La Habana por $85. Sin entregar balita vacía. Recogida en Los Avioncitos, La Lisa, con PIN de seguridad.';

export const metadata: Metadata = {
  title: T,
  description: D,
  keywords: ['cilindro de gas La Habana', 'balita de gas Cuba', 'gas licuado La Habana', 'comprar gas para Cuba', 'gas sin entregar vacío', 'La Lisa'],
  alternates: { canonical: '/cilindro-de-gas-la-habana' },
  openGraph: { url: '/cilindro-de-gas-la-habana', title: T, description: D, type: 'website', siteName: 'Ambitosmax', locale: 'es_US' },
};

const producto = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Cilindro de gas lleno sin entrega de vacío — La Habana',
  description: D,
  image: `${SITIO}/carrusel/bala-gas.png`,
  brand: { '@type': 'Brand', name: 'Ambitosmax' },
  offers: {
    '@type': 'Offer',
    price: '85.00',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: `${SITIO}/cilindro-de-gas-la-habana`,
    seller: { '@id': `${SITIO}/#organizacion` },
  },
};

export default function Page() {
  return (
    <SeoPage
      ruta="/cilindro-de-gas-la-habana"
      titulo="Cilindro de gas lleno en La Habana"
      subtitulo="$85 USD · sin entregar balita vacía · recogida en Los Avioncitos, La Lisa"
      descripcion="Paga desde Estados Unidos y tu familiar recoge un cilindro de gas lleno en La Habana. No hace falta entregar un cilindro vacío a cambio. Reservas todos los días hasta las 8:00 PM: al confirmar tu pago recibes un PIN, y quien recoge presenta su carnet de identidad y dice el PIN en el punto de venta."
      beneficios={[
        'Precio fijo: $85 USD por cilindro lleno',
        'Sin entrega de balita vacía',
        'Recogida en Los Avioncitos, La Lisa, La Habana',
        'PIN de seguridad para recoger',
        'Pago por Zelle desde EE.UU.',
        'Reservas diarias hasta las 8:00 PM',
      ]}
      faqs={[
        { q: '¿Cuánto cuesta el cilindro de gas?', a: '$85 USD por cilindro lleno. No hace falta entregar un cilindro vacío.' },
        { q: '¿Dónde se recoge?', a: 'En "LOS AVIONCITOS": Calle 210 / calle 31 y 33, Alturas de la Coronela, municipio La Lisa, La Habana.' },
        { q: '¿Cómo se recoge?', a: 'Al confirmar tu pago recibes un PIN de 6 dígitos. La persona que recoge presenta su carnet de identidad y dice el PIN.' },
        { q: '¿Hasta qué hora puedo comprar?', a: 'Las ventas del día cierran a las 8:00 PM (hora de Cuba). Las reservas posteriores pasan al listado del día siguiente.' },
        { q: '¿Cómo pago?', a: 'Por Zelle desde Estados Unidos, usando tu número de reserva como referencia.' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(producto) }} />
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-12 text-center">
        <p className="text-sm font-bold text-amber-900 uppercase tracking-wide">Cilindro lleno · La Habana</p>
        <p className="text-4xl font-black text-[#071a46] mt-1">$85.00 USD</p>
        <Link href="/?v=reserva-cilindro" className="inline-block mt-4 bg-[#55b949] hover:bg-[#3f9a35] text-white font-bold px-8 py-3 rounded-md">
          Reservar mi cilindro
        </Link>
      </div>
    </SeoPage>
  );
}
