import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, BadgeCheck, Building2, CheckCircle2, Clock, Flame, Fuel, KeyRound,
  MapPin, MessageCircle, Phone, ShieldCheck, ShoppingCart, XCircle,
} from 'lucide-react';
import { CierreCountdown } from '@/components/ambitosmax/cierre-countdown';
import { SITIO } from '@/lib/seo-paginas';

// Página de ventas (para anuncios, TikTok y WhatsApp): una sola oferta, la balita de $85,
// con todos los datos reales del servicio y un botón de reserva en cada pantalla.
const T = 'Balita de gas llena para tu familia en La Habana — $85, sin entregar la vacía';
const D =
  'Paga desde EE.UU. y tu familia recoge hoy una balita de gas llena en La Habana por $85. Sin entregar el cilindro vacío, con PIN de seguridad. Empresa en Tampa, FL.';

export const metadata: Metadata = {
  title: T,
  description: D,
  alternates: { canonical: '/gas-para-cuba' },
  openGraph: { url: '/gas-para-cuba', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Ambitosmax' }], title: T, description: D, type: 'website', siteName: 'Ambitosmax', locale: 'es_US' },
};

const RESERVAR = '/?v=reserva-cilindro';
const WHATSAPP = 'https://wa.me/17275986802?text=' + encodeURIComponent('Hola, quiero reservar una balita de gas para mi familia en La Habana');
const PRECIO = 85;

const PASOS = [
  { icono: Flame, titulo: 'Reserva en 1 minuto', texto: 'Pon tu nombre, el de quien recoge en Cuba y su carnet. Hasta 4 balitas por reserva.' },
  { icono: ShieldCheck, titulo: 'Paga por Zelle', texto: 'Desde EE.UU., con tu número de reserva como referencia. Sin tarjetas ni intermediarios.' },
  { icono: KeyRound, titulo: 'Tu familia recoge', texto: 'Al confirmar el pago recibes un PIN de 6 dígitos. Tu familiar presenta carnet + PIN y se lleva la balita llena.' },
];

const COMPARACION: [string, string][] = [
  ['Hay que conseguir un cilindro vacío para cambiar', 'No hace falta entregar ninguna balita vacía'],
  ['Colas largas sin saber si habrá gas', 'Balita reservada a nombre de tu familiar'],
  ['Mandar efectivo y rezar para que llegue', 'Pagas tú desde EE.UU. por Zelle'],
  ['Cualquiera puede reclamar la entrega', 'Solo recoge quien tiene el carnet y el PIN'],
  ['Precio que cambia cada semana', 'Precio fijo: $85 por balita llena'],
];

const FAQS = [
  { q: '¿De verdad no tengo que entregar la balita vacía?', a: 'No. Pagas $85 y tu familiar se lleva un cilindro de gas lleno. No hace falta cambiar un vacío.' },
  { q: '¿Dónde se recoge?', a: 'En "LOS AVIONCITOS": Calle 210 / calle 31 y 33, Alturas de la Coronela, municipio La Lisa, La Habana.' },
  { q: '¿Cuándo puede recoger mi familia?', a: 'Las ventas del día cierran a las 8:00 PM (hora de Cuba). Si reservas antes, tu balita entra en el listado de hoy; si reservas después, en el de mañana.' },
  { q: '¿Cómo sé que mi dinero está seguro?', a: 'Somos una empresa en 6800 N Florida Ave, Tampa, FL. La balita solo se entrega a la persona que registraste, con su carnet de identidad y el PIN que te enviamos al confirmar el pago.' },
  { q: '¿Cómo pago?', a: 'Por Zelle desde Estados Unidos. Al reservar te mostramos el número de Zelle y tu número de reserva para usarlo como referencia.' },
  { q: '¿Puedo comprar varias?', a: 'Sí, hasta 4 balitas por reserva ($85 cada una). Para más, haz otra reserva o escríbenos por WhatsApp.' },
  { q: '¿Y si tengo una duda antes de pagar?', a: 'Escríbenos por WhatsApp o llámanos al +1 (727) 506-1845. Te atendemos en español.' },
];

const PRODUCTO_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Balita de gas llena en La Habana (sin entregar el vacío)',
  description: D,
  image: `${SITIO}/carrusel/bala-gas.png`,
  brand: { '@type': 'Brand', name: 'Ambitosmax' },
  offers: {
    '@type': 'Offer',
    price: PRECIO.toFixed(2),
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: `${SITIO}/gas-para-cuba`,
    seller: { '@id': `${SITIO}/#organizacion` },
  },
};

const FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

function BotonReservar({ grande = false, className = '' }: { grande?: boolean; className?: string }) {
  return (
    <Link
      href={RESERVAR}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#55b949] hover:bg-[#3f9a35] text-white font-black shadow-[0_10px_30px_rgba(85,185,73,0.45)] transition-transform hover:-translate-y-0.5 ${grande ? 'px-10 py-5 text-xl' : 'px-8 py-4 text-lg'} ${className}`}
    >
      Reservar mi balita — ${PRECIO} <ArrowRight className="h-5 w-5" />
    </Link>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-24 md:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([PRODUCTO_JSONLD, FAQ_JSONLD]).replace(/</g, '\\u003c') }} />

      {/* ═══ BARRA DE URGENCIA (dato real: cierre diario a las 8 PM de Cuba) ═══ */}
      <div className="bg-amber-400 text-[#071a46] text-center text-sm font-semibold py-2 px-4">
        <Clock className="inline h-4 w-4 mr-1.5 -mt-0.5" />
        <CierreCountdown />
      </div>

      <nav className="border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="font-black tracking-widest text-[#071a46]">AMBITOSMAX</Link>
          <a href="tel:+17275061845" className="flex items-center gap-1.5 text-sm font-bold text-[#123d83]">
            <Phone className="h-4 w-4" /> <span className="hidden sm:inline">+1 (727) 506-1845</span><span className="sm:hidden">Llamar</span>
          </a>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="bg-gradient-to-br from-[#071a46] via-[#123d83] to-[#1a4fa0] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20 grid md:grid-cols-[1.4fr_1fr] gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <MapPin className="h-3.5 w-3.5" /> Recogida en La Habana
            </p>
            <h1 className="text-4xl md:text-6xl font-black leading-[1.05] mt-5">
              Que tu familia cocine hoy, <span className="text-[#7ee06f]">sin colas y sin entregar la balita vacía.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mt-5 max-w-xl">
              Pagas desde Estados Unidos y tu familiar recoge una balita de gas <b className="text-white">llena</b> en La Habana con su carnet y un PIN. Así de simple.
            </p>
            <div className="flex items-end gap-3 mt-7">
              <span className="text-6xl font-black">${PRECIO}</span>
              <span className="text-white/70 pb-2">USD por balita llena<br />precio fijo, sin sorpresas</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <BotonReservar grande />
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-white/30 bg-white/10 hover:bg-white/20 px-6 py-4 font-bold">
                <MessageCircle className="h-5 w-5" /> Preguntar por WhatsApp
              </a>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 mt-6 text-sm text-white/80">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#7ee06f]" /> Sin entregar vacío</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#7ee06f]" /> Pago por Zelle</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#7ee06f]" /> PIN de seguridad</li>
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-[#55b949]/30 blur-3xl rounded-full" aria-hidden="true" />
            <img src="/carrusel/bala-gas.png" alt="Balita de gas llena para recoger en La Habana" className="relative mx-auto max-h-[300px] md:max-h-[420px] object-contain drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* ═══ FRANJA DE CONFIANZA ═══ */}
      <section className="border-b border-zinc-100 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            [Building2, 'Empresa en Tampa, FL', '6800 N Florida Ave'],
            [ShieldCheck, 'Pago seguro', 'Zelle desde EE.UU.'],
            [KeyRound, 'Entrega protegida', 'Carnet + PIN de 6 dígitos'],
            [Phone, 'Atención en español', '+1 (727) 506-1845'],
          ].map(([Icono, titulo, sub]) => {
            const I = Icono as typeof Building2;
            return (
              <div key={titulo as string} className="flex items-start gap-3">
                <I className="h-6 w-6 text-[#123d83] shrink-0" />
                <div><p className="font-bold">{titulo as string}</p><p className="text-zinc-500">{sub as string}</p></div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ PROBLEMA → SOLUCIÓN ═══ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-black text-center text-[#071a46]">Conseguir gas en Cuba no debería ser una odisea</h2>
        <p className="text-center text-zinc-600 mt-3 max-w-2xl mx-auto">Tú sabes lo que pasa allá: sin gas no se cocina. Por eso lo hicimos tan fácil como pagar una cuenta.</p>
        <div className="mt-10 rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="grid grid-cols-2 bg-zinc-100 text-xs sm:text-sm font-black uppercase tracking-wide">
            <p className="p-4 text-zinc-500">Por tu cuenta</p>
            <p className="p-4 text-[#123d83] bg-blue-50">Con Ambitosmax</p>
          </div>
          {COMPARACION.map(([mal, bien]) => (
            <div key={mal} className="grid grid-cols-2 border-t border-zinc-200 text-sm sm:text-base">
              <p className="p-4 flex gap-2 text-zinc-500"><XCircle className="h-5 w-5 text-red-400 shrink-0" /> {mal}</p>
              <p className="p-4 flex gap-2 font-semibold bg-blue-50/50"><CheckCircle2 className="h-5 w-5 text-[#55b949] shrink-0" /> {bien}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CÓMO FUNCIONA ═══ */}
      <section className="bg-[#f5f7fa] py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-black text-center text-[#071a46]">Así de fácil, en 3 pasos</h2>
          <div className="grid md:grid-cols-3 gap-5 mt-10">
            {PASOS.map(({ icono: I, titulo, texto }, i) => (
              <div key={titulo} className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-[#123d83] text-white font-black flex items-center justify-center">{i + 1}</span>
                  <I className="h-6 w-6 text-[#55b949]" />
                </div>
                <h3 className="text-xl font-black mt-4">{titulo}</h3>
                <p className="text-zinc-600 mt-2">{texto}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10"><BotonReservar /></div>
        </div>
      </section>

      {/* ═══ OFERTA ═══ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-3xl border-2 border-[#55b949] bg-gradient-to-b from-green-50 to-white p-6 sm:p-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-[#348f39]">Lo que recibe tu familia</p>
            <h2 className="text-3xl font-black text-[#071a46] mt-2">1 balita de gas llena, lista para cocinar</h2>
            <ul className="space-y-3 mt-6">
              {[
                'Cilindro lleno, sin entregar el vacío',
                'Recogida en Los Avioncitos, La Lisa, La Habana',
                'PIN de seguridad a nombre de quien recoge',
                'Confirmación de tu reserva al momento',
                'Hasta 4 balitas en la misma reserva',
              ].map((b) => (
                <li key={b} className="flex gap-2"><BadgeCheck className="h-5 w-5 text-[#55b949] shrink-0 mt-0.5" /> {b}</li>
              ))}
            </ul>
          </div>
          <div className="text-center bg-white rounded-2xl border border-zinc-100 shadow-lg p-8">
            <p className="text-zinc-500 font-semibold">Precio por balita</p>
            <p className="text-7xl font-black text-[#071a46] mt-1">${PRECIO}</p>
            <p className="text-zinc-500 mt-1">USD · precio fijo</p>
            <BotonReservar className="w-full mt-6" />
            <p className="text-xs text-zinc-500 mt-4 flex items-center justify-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Reserva antes de las 8:00 PM (Cuba) para recoger hoy
            </p>
          </div>
        </div>
      </section>

      {/* ═══ PREGUNTAS (objeciones) ═══ */}
      <section className="bg-[#f5f7fa] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-black text-center text-[#071a46]">Tus dudas, resueltas</h2>
          <div className="space-y-3 mt-10">
            {FAQS.map((f) => (
              <details key={f.q} className="group bg-white rounded-xl p-5 border border-zinc-100">
                <summary className="font-bold cursor-pointer list-none flex justify-between gap-4">
                  {f.q} <span className="text-[#123d83] group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="text-zinc-600 mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TAMBIÉN TE PUEDE INTERESAR ═══ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-black text-center text-[#071a46]">¿Tu familia necesita algo más?</h2>
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          <Link href="/diesel-y-gasolina-en-cuba" className="flex items-center gap-4 rounded-2xl border border-zinc-200 p-5 hover:border-[#123d83] hover:shadow-md transition">
            <Fuel className="h-10 w-10 text-[#123d83] shrink-0" />
            <div><p className="font-black">Diésel y gasolina en Cuba</p><p className="text-sm text-zinc-500">Diésel a $2.37/litro en Perla Negra, Bayamo. Carga con PIN.</p></div>
          </Link>
          <Link href="/?v=tienda" className="flex items-center gap-4 rounded-2xl border border-zinc-200 p-5 hover:border-[#123d83] hover:shadow-md transition">
            <ShoppingCart className="h-10 w-10 text-[#123d83] shrink-0" />
            <div><p className="font-black">Tienda para Cuba</p><p className="text-sm text-zinc-500">Electrodomésticos, motos, energía solar y más.</p></div>
          </Link>
        </div>
      </section>

      {/* ═══ CIERRE ═══ */}
      <section className="bg-[#071a46] text-white py-16 px-4 sm:px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-black max-w-3xl mx-auto leading-tight">Hoy mismo tu familia puede tener gas en casa.</h2>
        <p className="text-white/70 mt-4">
          <CierreCountdown />
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <BotonReservar grande />
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-6 py-4 font-bold hover:bg-white/10">
            <MessageCircle className="h-5 w-5" /> WhatsApp
          </a>
        </div>
      </section>

      <footer className="bg-zinc-50 border-t border-zinc-100 py-6 px-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} Ambitosmax · 6800 N Florida Ave, Tampa, FL 33604 · <a href="tel:+17275061845" className="hover:underline">+1 (727) 506-1845</a> · <Link href="/" className="hover:underline">ambitosmax.com</Link>
      </footer>

      {/* ═══ BOTÓN FIJO EN MÓVIL ═══ */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-zinc-200 p-3 flex gap-2">
        <Link href={RESERVAR} className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#55b949] text-white font-black py-3.5">
          Reservar — ${PRECIO}
        </Link>
        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="inline-flex items-center justify-center rounded-xl bg-[#25D366] text-white px-4">
          <MessageCircle className="h-6 w-6" />
        </a>
      </div>
    </div>
  );
}
