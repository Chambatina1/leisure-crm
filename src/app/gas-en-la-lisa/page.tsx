import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPage, ContenidoSeo } from '@/components/ambitosmax/seo-page';
import { SITIO } from '@/lib/seo-paginas';

// Página local: búsquedas de gas por zona (La Lisa, Arroyo Arenas, Alturas de la Coronela).
const T = 'Gas en La Lisa, La Habana — Balitas en Arroyo Arenas y Alturas de la Coronela';
const D =
  'Balitas de gas llenas en La Lisa por $85, sin entregar el vacío. Recogida en Bar Madera (Arroyo Arenas) o Los Avioncitos (Alturas de la Coronela). Paga desde EE.UU.';

export const metadata: Metadata = {
  title: T,
  description: D,
  keywords: ['gas La Lisa', 'balita de gas La Lisa', 'gas Arroyo Arenas', 'gas Alturas de la Coronela', 'cilindro de gas La Habana', 'Bar Madera gas', 'Los Avioncitos gas'],
  alternates: { canonical: '/gas-en-la-lisa' },
  openGraph: { url: '/gas-en-la-lisa', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Ambitosmax' }], title: T, description: D, type: 'website', siteName: 'Ambitosmax', locale: 'es_US' },
};

const PUNTOS = [
  {
    nombre: 'Bar Madera',
    zona: 'Arroyo Arenas',
    direccion: 'Punto de gas "Bar Madera", Arroyo Arenas, municipio La Lisa, La Habana',
  },
  {
    nombre: 'Los Avioncitos',
    zona: 'Alturas de la Coronela',
    direccion: 'Calle 210 entre 31 y 33, Alturas de la Coronela, municipio La Lisa, La Habana',
  },
];

const JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Balita de gas llena en La Lisa, La Habana (sin entregar el vacío)',
  description: D,
  image: `${SITIO}/carrusel/bala-gas.png`,
  brand: { '@type': 'Brand', name: 'Ambitosmax' },
  offers: {
    '@type': 'Offer',
    price: '85.00',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: `${SITIO}/gas-en-la-lisa`,
    seller: { '@id': `${SITIO}/#organizacion` },
    areaServed: { '@type': 'Place', name: 'La Lisa, La Habana, Cuba' },
  },
};

export default function Page() {
  return (
    <SeoPage
      ruta="/gas-en-la-lisa"
      titulo="Gas en La Lisa, La Habana"
      subtitulo="Balitas de gas llenas por $85 · recogida en Arroyo Arenas o Alturas de la Coronela"
      descripcion="Si tu familia vive en La Lisa o cerca, puede recoger una balita de gas llena en uno de nuestros dos puntos del municipio, sin entregar el cilindro vacío. Tú pagas desde Estados Unidos y ellos solo tienen que ir con su carnet y el PIN."
      beneficios={[
        '$85 USD por balita llena',
        'Sin entregar el cilindro vacío',
        'Dos puntos en La Lisa: Arroyo Arenas y Alturas de la Coronela',
        'Pago por Zelle desde EE.UU.',
        'Recogida con carnet + PIN de 6 dígitos',
        'Ventas diarias hasta las 8:00 PM',
      ]}
      faqs={[
        { q: '¿Dónde puedo recoger gas en La Lisa?', a: 'En el punto de gas "Bar Madera", en Arroyo Arenas, o en "Los Avioncitos", en Calle 210 entre 31 y 33, Alturas de la Coronela. Eliges el punto al reservar.' },
        { q: '¿Cuánto cuesta la balita de gas?', a: '$85 USD por balita llena, sin entregar la vacía.' },
        { q: '¿Puedo recoger si vivo en otro municipio?', a: 'Sí. Cualquier persona puede recoger en los puntos de La Lisa con su carnet y el PIN; solo tiene que llegar hasta allí.' },
        { q: '¿Cuántas balitas puedo comprar?', a: 'Hasta 4 por reserva. Para más, haz otra reserva.' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD).replace(/</g, '\\u003c') }} />

      <div className="grid sm:grid-cols-2 gap-4 mb-12">
        {PUNTOS.map((p) => (
          <div key={p.nombre} className="rounded-2xl border-2 border-[#55b949]/40 bg-green-50/50 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-[#348f39]">{p.zona}</p>
            <h2 className="text-xl font-black text-[#071a46] mt-1">{p.nombre}</h2>
            <p className="text-sm text-zinc-600 mt-2">{p.direccion}</p>
          </div>
        ))}
      </div>

      <ContenidoSeo
        secciones={[
          {
            h2: 'Balitas de gas en Arroyo Arenas',
            p: [
              'El punto de gas "Bar Madera" está en Arroyo Arenas, en el municipio La Lisa. Es el punto más cómodo para las familias de Arroyo Arenas y de los repartos cercanos. Al reservar en Ambitosmax eliges "Bar Madera" como punto de recogida y tu familiar va allí con su carnet y el PIN.',
            ],
          },
          {
            h2: 'Balitas de gas en Alturas de la Coronela',
            p: [
              '"Los Avioncitos" está en Calle 210 entre 31 y 33, en Alturas de la Coronela, también en La Lisa. Funciona igual: reservas, pagas por Zelle y, con el PIN que recibes, tu familiar recoge la balita llena.',
            ],
          },
          {
            h2: 'Cómo funciona la compra',
            p: [
              'Reservas en la web con el nombre y el carnet de quien recoge, eliges el punto y la cantidad (hasta 4 balitas), y pagas $85 por balita por Zelle con tu número de reserva como referencia. Al confirmar el pago recibes un PIN de 6 dígitos. Las reservas pagadas antes de las 8:00 PM (hora de Cuba) entran en el listado de recogida de ese día.',
              <>¿Tienes más preguntas? Mira la guía completa de <Link href="/balitas-de-gas-en-cuba" className="text-[#123d83] font-semibold underline">balitas de gas en Cuba</Link>.</>,
            ],
          },
        ]}
      />

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-12 text-center">
        <p className="text-sm font-bold text-amber-900 uppercase tracking-wide">Balita llena · La Lisa</p>
        <p className="text-4xl font-black text-[#071a46] mt-1">$85.00 USD</p>
        <Link href="/?v=reserva-cilindro" className="inline-block mt-4 bg-[#55b949] hover:bg-[#3f9a35] text-white font-bold px-8 py-3 rounded-md">
          Reservar mi balita
        </Link>
      </div>
    </SeoPage>
  );
}
