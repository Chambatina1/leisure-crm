'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Fuel,
  Package,
  Zap,
  Bike,
  Truck,
  ChevronRight,
  ChevronLeft,
  Phone,
  MapPin,
  Search,
  Flame,
  Refrigerator,
  ShoppingCart,
  MessageCircle,
} from 'lucide-react';
import { AnimatedSeaBackground } from './hero-illustrations';
import { CarruselProductos } from './carrusel-productos';

const SLIDES = [
  {
    id: 'gas',
    icon: Flame,
    titulo: 'Balas de Gas',
    sub: '',
    precio: 'Desde $15.00',
    texto: 'Reservá tu balita',
    color: '#55b949',
    imagen: <img src="/carrusel/bala-gas.png" alt="Balas de gas" className="max-w-full max-h-[220px] md:max-h-[340px] object-contain drop-shadow-xl mx-auto" />,
  },
  {
    id: 'energia',
    icon: Fuel,
    titulo: 'Energía Solar',
    sub: '',
    precio: 'Desde $299',
    texto: 'Consultá energía',
    color: '#2f7fd1',
    imagen: <img src="/carrusel/inversor.png" alt="Inversor de corriente" className="max-w-full max-h-[220px] md:max-h-[340px] object-contain drop-shadow-xl mx-auto" />,
  },
  {
    id: 'motos',
    icon: Package,
    titulo: 'Motos',
    sub: '',
    precio: 'Desde $1,200',
    texto: 'Tu moto en Cuba',
    color: '#7c3aed',
    imagen: <img src="/carrusel/moto.png" alt="Moto Panther" className="max-w-full max-h-[220px] md:max-h-[340px] object-contain drop-shadow-xl mx-auto" />,
  },
];

export function Home() {
  const { setCurrentView } = useAppStore();
  const [slide, setSlide] = useState(0);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const slideActual = SLIDES[slide];
  const Icono = slideActual.icon;

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* ═══ HERO: VIDEO LIMPIO A PANTALLA COMPLETA ═══ */}
      <section className="relative h-[60vh] min-h-[380px] md:h-[70vh] overflow-hidden">
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/malecon4.mp4" type="video/mp4" />
        </video>
        {/* Sombra muy sutil abajo */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)" }} />

        {/* FIRMA elegante: aparece como escrita a mano, se queda, luego se desvanece */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <motion.span
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scaleX: [0, 1, 1, 1] }}
            transition={{
              duration: 6,
              times: [0, 0.25, 0.75, 1],
              ease: 'easeInOut',
            }}
            className="text-4xl md:text-6xl select-none"
            style={{
              fontFamily: "'Brush Script MT', 'Segoe Script', 'Dancing Script', cursive",
              color: 'rgba(255,255,255,0.95)',
              textShadow: '0 2px 30px rgba(0,0,0,0.6), 0 0 60px rgba(0,0,0,0.2)',
              transformOrigin: 'left center',
              letterSpacing: '0.02em',
            }}
          >
            Ambitosmax
          </motion.span>
        </div>

        {/* Logo centrado — el video corre sin interrupciones */}
      </section>

      {/* ═══ BOTONES + REDES SOCIALES — justo debajo del video ═══ */}
      <section className="bg-white py-6 md:py-8 border-b border-zinc-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch">
            <button
              onClick={() => setCurrentView('combustible')}
              className="btn-combustible"
            >
              Comprar combustible
            </button>
            <Button
              onClick={() => setCurrentView('tienda')}
              className="bg-[#123d83] hover:bg-[#071a46] text-white font-bold px-8 h-14 text-base shadow-lg"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Ir a la Tienda
            </Button>
          </div>

          {/* Redes sociales */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <a
              href="https://www.tiktok.com/@ambitosmax"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-zinc-900 hover:bg-black text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors shadow-md"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .6.05.88.13V9.4a6.33 6.33 0 0 0-1-.05A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              TikTok
            </a>
            <a
              href="https://wa.me/17275986802"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors shadow-md"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ═══ VITRINA DE PRODUCTOS — carrusel con los productos reales de la tienda ═══ */}
      <CarruselProductos />

      {/* ═══ TEXTO PARA BUSCADORES + ENLACES INTERNOS ═══ */}
      <section className="max-w-4xl mx-auto px-6 mt-12">
        <h1 className="text-2xl md:text-3xl font-black text-[#071a46] leading-tight">
          Balitas de gas, diésel y gasolina en Cuba
        </h1>
        <p className="text-zinc-600 mt-3 leading-relaxed">
          En Ambitosmax compras desde Estados Unidos y tu familia recibe en Cuba: balitas de gas en Cuba (cilindro lleno sin entregar el vacío)
          con recogida en La Habana, diésel y gasolina en Cuba en servicentros como Perla Negra (Bayamo), electrodomésticos, motos, plantas eléctricas,
          alimentos y envíos marítimos y aéreos a toda Cuba.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mt-8 text-sm text-zinc-600 leading-relaxed">
          <div>
            <h2 className="text-lg font-black text-[#071a46] mb-2">Balitas de gas en La Habana</h2>
            <p>Balita de gas llena por $85, sin entregar el cilindro vacío. Tu familiar la recoge en La Lisa, en Arroyo Arenas (Bar Madera) o en Alturas de la Coronela (Los Avioncitos), con su carnet y un PIN de 6 dígitos.</p>
          </div>
          <div>
            <h2 className="text-lg font-black text-[#071a46] mb-2">Diésel y gasolina en Cuba</h2>
            <p>Eliges el servicentro, el combustible y los litros; pagas por Zelle y tu familiar carga con un PIN. Diésel a $2.37 el litro en el Servicentro Perla Negra, Bayamo, Granma.</p>
          </div>
          <div>
            <h2 className="text-lg font-black text-[#071a46] mb-2">Compra desde Estados Unidos</h2>
            <p>Ambitosmax tiene su dirección en 6800 N Florida Ave, Tampa, Florida. Pagas desde tu banco en EE.UU. y te atendemos en español por WhatsApp o al +1 (727) 506-1845.</p>
          </div>
        </div>
        <ul className="flex flex-wrap gap-2 mt-4 text-sm">
          {[
            ['/balitas-de-gas-en-cuba', 'Balitas de gas en Cuba'],
            ['/gas-en-la-lisa', 'Gas en La Lisa'],
            ['/diesel-y-gasolina-en-cuba', 'Diésel y gasolina en Cuba'],
            ['/tienda-cuba', 'Tienda para Cuba'],
            ['/envios-a-cuba', 'Envíos a Cuba'],
            ['/electrodomesticos-para-cuba', 'Electrodomésticos'],
            ['/alimentos-para-cuba', 'Alimentos'],
            ['/medicamentos-a-cuba', 'Medicamentos'],
          ].map(([href, txt]) => (
            <li key={href}>
              <a href={href} className="inline-block bg-white border border-zinc-200 rounded-full px-3 py-1.5 text-[#123d83] font-semibold hover:bg-blue-50">
                {txt}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ═══ CONTACTO ═══ */}
      <section className="max-w-6xl mx-auto px-6 mt-12 pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Phone className="w-6 h-6 text-[#123d83]" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Llámanos</h4>
              <p className="text-sm text-gray-500">+1 (727) 506-1845</p>
              <p className="text-sm text-gray-500">Lun-Vie 8AM-5PM</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-[#123d83]" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Tampa, Florida</h4>
              <p className="text-sm text-gray-500">6800 N Florida Ave</p>
              <p className="text-sm text-gray-500">Tampa, FL 33604</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Truck className="w-6 h-6 text-[#123d83]" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Envíos a Cuba</h4>
              <p className="text-sm text-gray-500">Marítimo y aéreo</p>
              <p className="text-sm text-gray-500">Entrega garantizada</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ═══ BOTÓN FLOTANTE DE CHAT — siempre visible ═══
export function FloatingChatButton() {
  const { setCurrentView } = useAppStore();
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={() => setCurrentView('chat')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="fixed bottom-20 right-4 z-[60] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all"
      style={{
        background: 'linear-gradient(135deg, #123d83 0%, #071a46 100%)',
        border: '2px solid rgba(85,185,73,0.4)',
        transform: hover ? 'scale(1.08)' : 'scale(1)',
      }}
    >
      <MessageCircle className="w-6 h-6 text-[#7ed957]" />
      {hover && (
        <span className="absolute right-16 whitespace-nowrap bg-white text-zinc-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
          Chatea con nosotros
        </span>
      )}
    </button>
  );
}
