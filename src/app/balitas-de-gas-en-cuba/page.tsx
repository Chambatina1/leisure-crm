import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPage } from '@/components/ambitosmax/seo-page';
import { SITIO } from '@/lib/seo-paginas';

const T = 'Balitas de gas en Cuba — Cilindro lleno en La Habana por $85';
const D =
  'Compra balitas de gas en Cuba desde EE.UU.: cilindro de gas lleno por $85 sin entregar la balita vacía. Recogida en La Habana (Los Avioncitos o Bar Madera, La Lisa) con PIN de seguridad.';

export const metadata: Metadata = {
  title: T,
  description: D,
  keywords: ['balitas de gas en Cuba', 'balita de gas Cuba', 'comprar balita de gas para Cuba', 'cilindro de gas La Habana', 'gas licuado Cuba', 'balita de gas sin entregar vacío', 'gas La Lisa'],
  alternates: { canonical: '/balitas-de-gas-en-cuba' },
  openGraph: { url: '/balitas-de-gas-en-cuba', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Ambitosmax' }], title: T, description: D, type: 'website', siteName: 'Ambitosmax', locale: 'es_US' },
};

const producto = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Balita de gas llena en Cuba (cilindro sin entrega de vacío) — La Habana',
  description: D,
  image: `${SITIO}/carrusel/bala-gas.png`,
  brand: { '@type': 'Brand', name: 'Ambitosmax' },
  offers: {
    '@type': 'Offer',
    price: '85.00',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: `${SITIO}/balitas-de-gas-en-cuba`,
    seller: { '@id': `${SITIO}/#organizacion` },
  },
};

export default function Page() {
  return (
    <SeoPage
      ruta="/balitas-de-gas-en-cuba"
      titulo="Balitas de gas en Cuba"
      subtitulo="Cilindro de gas lleno por $85 USD · sin entregar la balita vacía · recogida en La Habana"
      descripcion="¿Buscas balitas de gas en Cuba para tu familia? Paga desde Estados Unidos y tu familiar recoge una balita (cilindro) de gas llena en La Habana. No hace falta entregar un cilindro vacío a cambio. Reservas todos los días hasta las 8:00 PM: al confirmar tu pago recibes un PIN, y quien recoge presenta su carnet de identidad y dice el PIN en el punto de venta."
      beneficios={[
        'Precio fijo: $85 USD por cilindro lleno',
        'Sin entrega de balita vacía',
        'Recogida en Los Avioncitos o Bar Madera (Arroyo Arenas), La Lisa',
        'PIN de seguridad para recoger',
        'Pago por Zelle desde EE.UU.',
        'Reservas diarias hasta las 8:00 PM',
      ]}
      faqs={[
        { q: '¿Cuánto cuesta una balita de gas en Cuba?', a: '$85 USD por balita (cilindro) de gas llena. No hace falta entregar la balita vacía.' },
        { q: '¿Puedo comprar la balita de gas desde Estados Unidos?', a: 'Sí. Pagas desde EE.UU. por Zelle y tu familiar en Cuba la recoge con su carnet y el PIN.' },
        { q: '¿Dónde se recoge?', a: 'En uno de nuestros dos puntos de La Lisa, La Habana, el que elijas al reservar: "LOS AVIONCITOS" (Calle 210 / calle 31 y 33, Alturas de la Coronela) o el punto de gas "BAR MADERA" en Arroyo Arenas.' },
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
