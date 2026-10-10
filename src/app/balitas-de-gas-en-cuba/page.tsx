import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPage, ContenidoSeo } from '@/components/ambitosmax/seo-page';
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
      <ContenidoSeo
        secciones={[
          {
            h2: '¿Cómo comprar una balita de gas para tu familia en Cuba?',
            p: [
              'Comprar una balita de gas para Cuba desde Estados Unidos con Ambitosmax se hace en tres pasos. Primero reservas en la web: escribes tu nombre y teléfono, el nombre y el carnet de identidad de la persona que va a recoger en Cuba, cuántas balitas quieres (hasta 4 por reserva) y en qué punto de La Lisa las va a recoger.',
              'Después pagas por Zelle desde Estados Unidos, usando tu número de reserva (por ejemplo RC-000123) como referencia. Cuando confirmamos el pago te enviamos un PIN de 6 dígitos. Por último, tu familiar va al punto de recogida, presenta su carnet de identidad, dice el PIN y se lleva la balita llena.',
            ],
          },
          {
            h2: 'Balita llena sin entregar el cilindro vacío',
            p: [
              'En Cuba, cambiar una balita de gas casi siempre exige llevar un cilindro vacío a cambio. Con Ambitosmax no hace falta: pagas $85 USD y tu familiar recibe un cilindro de gas licuado lleno, aunque no tenga ningún vacío para entregar. Es la forma más rápida de que una familia que se quedó sin cilindro vuelva a cocinar.',
            ],
          },
          {
            h2: 'Dónde se recogen las balitas de gas en La Habana',
            p: [
              'Tenemos dos puntos de recogida en el municipio La Lisa, La Habana, y eliges uno al reservar. El primero es "Los Avioncitos", en Calle 210 entre 31 y 33, Alturas de la Coronela. El segundo es el punto de gas "Bar Madera", en Arroyo Arenas.',
              'Cada día, al cierre de ventas, cada punto recibe el listado de las personas que van a recoger, con su nombre, su carnet y la cantidad de balitas. Por eso solo la persona registrada en la reserva puede llevarse el gas.',
            ],
          },
          {
            h2: 'Horario: las ventas cierran a las 8:00 PM, hora de Cuba',
            p: [
              'Puedes reservar a cualquier hora. Las reservas pagadas antes de las 8:00 PM (hora de Cuba) entran en el listado de recogida de ese día; las que se hacen después pasan al listado del día siguiente. Si pagas tarde y tu día ya cerró, tu reserva pasa sola al siguiente listado abierto.',
            ],
          },
          {
            h2: 'Por qué es seguro comprar gas para Cuba con Ambitosmax',
            p: [
              'Ambitosmax es una empresa con dirección en 6800 N Florida Ave, Tampa, Florida. El pago se hace por Zelle desde tu banco en Estados Unidos, y la entrega está protegida por dos datos que solo tú y tu familiar conocen: el carnet de identidad registrado y el PIN de 6 dígitos. Además puedes consultar el estado de tu reserva y tu PIN cuando quieras con tu número de reserva y tu teléfono.',
              'Si tienes dudas antes de pagar, escríbenos por WhatsApp o llama al +1 (727) 506-1845. Te atendemos en español.',
            ],
          },
        ]}
      />
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
