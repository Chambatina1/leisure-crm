'use client';

import { useAppStore } from './store';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Search, ArrowRight } from 'lucide-react';

interface SeoPageProps {
  titulo: string;
  subtitulo: string;
  descripcion: string;
  beneficios: string[];
  faqs: { q: string; a: string }[];
}

export function SeoPage({ titulo, subtitulo, descripcion, beneficios, faqs }: SeoPageProps) {
  const { setCurrentView } = useAppStore();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#071a46] via-[#123d83] to-[#1a4fa0] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">{titulo}</h1>
          <p className="text-lg md:text-xl text-white/80">{subtitulo}</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Button onClick={() => setCurrentView('tienda')} className="bg-[#55b949] hover:bg-[#348f39] text-white font-bold px-8 py-4 text-base">
              <ShoppingCart className="mr-2 h-5 w-5" /> Ver Productos
            </Button>
            <Button onClick={() => setCurrentView('combustible')} className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 font-bold px-8 py-4 text-base">
              Comprar Combustible
            </Button>
          </div>
        </div>
      </section>

      {/* Contenido */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-lg text-zinc-600 leading-relaxed mb-8">{descripcion}</p>

        {/* Beneficios */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {beneficios.map((b, i) => (
            <div key={i} className="bg-zinc-50 rounded-xl p-5 border border-zinc-100">
              <p className="font-semibold text-zinc-800">✓ {b}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-[#071a46] rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-black text-white mb-2">¿Listo para enviar?</h2>
          <p className="text-white/60 mb-6">Tu familia en Cuba te espera</p>
          <Button onClick={() => setCurrentView('tienda')} className="bg-[#55b949] hover:bg-[#348f39] text-white font-bold px-10 py-4 text-lg">
            Comenzar ahora <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* FAQs */}
        {faqs.length > 0 && (
          <div>
            <h2 className="text-2xl font-black text-zinc-900 mb-6">Preguntas frecuentes</h2>
            <div className="space-y-4">
              {faqs.map((f, i) => (
                <details key={i} className="bg-zinc-50 rounded-xl p-5 border border-zinc-100">
                  <summary className="font-bold text-zinc-800 cursor-pointer">{f.q}</summary>
                  <p className="text-zinc-600 mt-3 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
