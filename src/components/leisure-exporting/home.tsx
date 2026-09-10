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
          className="absolute inset-0 w-full h-full object-cover hero-video-1"
        >
          <source src="/videos/malecon2.mp4" type="video/mp4" />
        </video>
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover hero-video-2"
        >
          <source src="/videos/malecon.mp4" type="video/mp4" />
        </video>
        {/* Sombra muy sutil abajo para el logo */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)" }} />

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
            <Button
              onClick={() => window.open('https://cargowis.com/leisureexporting', '_blank', 'noopener')}
              className="bg-white border-2 border-[#123d83]/30 text-[#123d83] hover:bg-blue-50 font-bold px-8 h-14 text-base"
            >
              <Search className="mr-2 h-5 w-5" />
              Rastrear pedido
            </Button>
          </div>

          {/* Redes sociales */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <a
              href="https://www.tiktok.com/@leisure.exporting"
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

      {/* ═══ BUSCADOR DE RASTREO ═══ */}
      <section className="max-w-2xl mx-auto px-6 mt-12">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Search className="w-5 h-5 text-[#123d83]" />
            Rastrear tu pedido
          </h3>
          <div className="flex gap-2">
            <Input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="CPK-XXXXXXX o nombre..."
              className="flex-1"
              onKeyDown={e => { if (e.key === 'Enter') setCurrentView('rastreador'); }}
            />
            <Button
              onClick={() => setCurrentView('rastreador')}
              className="bg-[#123d83] hover:bg-[#071a46] text-white font-bold px-6"
            >
              Buscar
            </Button>
          </div>
        </div>
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
              <p className="text-sm text-gray-500">Leisure Exporting LLC</p>
              <p className="text-sm text-gray-500">EE.UU.</p>
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
