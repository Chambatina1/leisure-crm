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
} from 'lucide-react';
import { AnimatedSeaBackground } from './hero-illustrations';

const SLIDES = [
  {
    id: 'gas',
    icon: Flame,
    titulo: 'Balas de Gas',
    sub: '10, 20, 25 y 100 lb — entrega a domicilio en toda Cuba',
    precio: 'Desde $15.00',
    texto: 'Reservá tu balita',
    color: '#55b949',
    imagen: <img src="/carrusel/bala-gas.png" alt="Balas de gas" className="w-full h-full object-contain drop-shadow-2xl" />,
  },
  {
    id: 'energia',
    icon: Fuel,
    titulo: 'Energía Solar',
    sub: 'Inversores y plantas eléctricas — entrega en Cuba',
    precio: 'Desde $299',
    texto: 'Consultá energía',
    color: '#2f7fd1',
    imagen: <img src="/carrusel/inversor.png" alt="Inversor de corriente" className="w-full h-full object-contain drop-shadow-2xl" />,
  },
  {
    id: 'motos',
    icon: Package,
    titulo: 'Motos',
    sub: 'Panther y ADVI — entrega armada en Cuba, con garantía',
    precio: 'Desde $1,200',
    texto: 'Tu moto en Cuba',
    color: '#7c3aed',
    imagen: <img src="/carrusel/moto.png" alt="Moto Panther" className="w-full h-full object-contain drop-shadow-2xl" />,
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
      {/* ═══ HERO CON FONDO MARINO ANIMADO + CARRUSEL ═══ */}
      <section className="relative h-[520px] overflow-hidden">
        {/* 🎬 Video de fondo: auto clásico en La Habana (uso libre, Mixkit) */}
        <video
          autoPlay muted loop playsInline
          
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/malecon.mp4" type="video/mp4" />
        </video>
        {/* Velo azul para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 h-full flex items-center">
          <div className="w-full grid md:grid-cols-2 gap-6 items-center">
            {/* Texto del carrusel */}
            <div>
              <motion.img
                src="/logo-white.svg"
                alt="Leisure Exporting LLC"
                className="h-12 mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                >
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-white text-sm font-bold mb-4"
                    style={{ background: `${slideActual.color}55` }}
                  >
                    <Icono className="w-4 h-4" />
                    {slideActual.precio}
                  </div>
                  <h1 className="text-5xl md:text-6xl font-black text-white leading-none tracking-tight">
                    {slideActual.titulo}
                  </h1>
                  <p className="text-lg text-white/80 mt-4 max-w-md">{slideActual.sub}</p>
                </motion.div>
              </AnimatePresence>

              <div className="flex flex-wrap gap-3 mt-8">
                <button
                  onClick={() => setCurrentView('combustible')}
                  className="btn-combustible !w-auto px-8"
                  style={{ height: '3.75rem' }}
                >
                  Comprar combustible
                </button>
                <Button
                  onClick={() => setCurrentView('tienda')}
                  className="bg-white/95 hover:bg-white text-[#071a46] font-bold px-8 py-6 text-base shadow-lg"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Ir a la Tienda
                </Button>
                <Button
                  onClick={() => window.open('https://cargowis.com/leisureexporting', '_blank', 'noopener')}
                  className="bg-transparent border-2 border-white/40 text-white hover:bg-white/10 font-bold px-8 py-6 text-base"
                >
                  Rastrear pedido
                </Button>
              </div>

              {/* Flechas y puntos */}
              <div className="flex items-center gap-2 mt-8">
                <button
                  onClick={() => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length)}
                  className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className={`w-3 h-3 rounded-full transition-all ${i === slide ? 'bg-white scale-125' : 'bg-white/40'}`}
                  />
                ))}
                <button
                  onClick={() => setSlide(s => (s + 1) % SLIDES.length)}
                  className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Ilustración del carrusel (flotando suavemente) */}
            <div className="hidden md:block h-[380px] relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  className="absolute inset-0 hero-float"
                  initial={{ opacity: 0, scale: 0.85, rotate: -2 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
                  transition={{ duration: 0.5 }}
                >
                  {slideActual.imagen}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4 SERVICIOS PRINCIPALES ═══ */}
      <section className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SLIDES.map((s, idx) => {
            const esCombustible = idx === 0;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentView(esCombustible ? 'combustible' : 'tienda')}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
              >
                <div className="h-24 flex items-center justify-center mb-3 overflow-hidden">
                  <div className="scale-150">{s.imagen}</div>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{esCombustible ? 'Combustible' : s.titulo}</h3>
                <p className="text-sm text-gray-500 mt-1">{s.precio}</p>
                <span
                  className="text-sm font-bold mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all"
                  style={{ color: s.color }}
                >
                  Ver <ChevronRight className="w-4 h-4" />
                </span>
              </button>
            );
          })}
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
