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
        <div className="relative z-10 h-full flex flex-col items-center justify-center">
          <motion.img
            src="/logo-white.svg"
            alt="Leisure Exporting LLC"
            className="h-14 md:h-20 mb-4"
            style={{ filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.7))" }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          />
        </div>
      </section>

      {/* ═══ VITRINA: carrusel horizontal de productos (cintillo) ═══ */}
      <section className="bg-white py-6 md:py-8 border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest text-center mb-5">Nuestros productos</h2>
          <div className="flex gap-4 overflow-x-auto pb-3 px-1" style={{ scrollbarWidth: 'thin' }}>
            {[
              { img: '/carrusel/surtidor.png', titulo: 'Combustible', sub: 'Gasolineras de Cuba', view: 'combustible' },
              { img: '/carrusel/bala-gas.png', titulo: 'Balas de Gas', sub: 'Entrega a domicilio', view: 'tienda' },
              { img: '/carrusel/inversor.png', titulo: 'Energía Solar', sub: 'Inversores y plantas', view: 'tienda' },
              { img: '/carrusel/moto.png', titulo: 'Motos', sub: 'Entrega armada en Cuba', view: 'tienda' },
            ].map((prod, i) => (
              <button
                key={i}
                onClick={() => setCurrentView(prod.view as never)}
                className="flex-shrink-0 w-[160px] sm:w-[180px] group"
              >
                <div className="h-[120px] sm:h-[140px] flex items-center justify-center rounded-2xl bg-gradient-to-b from-zinc-50 to-white border border-zinc-100 overflow-hidden group-hover:border-[#123d83]/30 group-hover:shadow-lg transition-all">
                  <img src={prod.img} alt={prod.titulo} className="max-h-[100px] sm:max-h-[120px] object-contain" />
                </div>
                <p className="text-sm font-bold text-zinc-900 mt-2 text-center">{prod.titulo}</p>
                <p className="text-xs text-zinc-400 text-center">{prod.sub}</p>
              </button>
            ))}
          </div>
          {/* Indicador de scroll */}
          <p className="text-[10px] text-zinc-300 text-center mt-2">← Desliza para ver más →</p>
        </div>
      </section>

      {/* ═══ BOTONES PRINCIPALES ═══ */}
      <section className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
