'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon, ShoppingCart } from 'lucide-react';
import { useAppStore } from './store';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string;
  imagenUrl: string | null;
}

// Productos que van primero en el carrusel (por texto en el nombre)
const DESTACADOS = [/CILINDRO/i, /DI[EÉ]SEL/i, /BALA DE GAS/i];
const MAX_PRODUCTOS = 30;

function prioridad(p: Producto): number {
  const i = DESTACADOS.findIndex((r) => r.test(p.nombre));
  return i === -1 ? DESTACADOS.length : i;
}

export function CarruselProductos() {
  const { goToComprar, setCurrentView } = useAppStore();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pausado, setPausado] = useState(false);
  const [imgError, setImgError] = useState<Set<number>>(new Set());
  const pista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/tienda')
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && Array.isArray(j.data?.products)) {
          const lista: Producto[] = [...j.data.products]
            .sort((a: Producto, b: Producto) => prioridad(a) - prioridad(b))
            .slice(0, MAX_PRODUCTOS);
          setProductos(lista);
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const mover = useCallback((dir: 1 | -1) => {
    const el = pista.current;
    if (!el) return;
    const tarjeta = el.querySelector<HTMLElement>('[data-tarjeta]');
    const paso = (tarjeta?.offsetWidth ?? 200) + 16;
    const alFinal = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    if (dir === 1 && alFinal) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: dir * paso, behavior: 'smooth' });
    }
  }, []);

  // Avance automático cada 3.5 s; se pausa al tocar o pasar el ratón
  useEffect(() => {
    if (pausado || productos.length < 2) return;
    const t = setInterval(() => mover(1), 3500);
    return () => clearInterval(t);
  }, [pausado, productos.length, mover]);

  if (!cargando && productos.length === 0) return null;

  return (
    <section className="bg-zinc-50 py-8 border-b border-zinc-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Nuestros productos</h2>
          <button
            onClick={() => setCurrentView('tienda')}
            className="text-xs font-bold text-[#123d83] hover:underline"
          >
            Ver toda la tienda →
          </button>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          onTouchStart={() => setPausado(true)}
        >
          <button
            aria-label="Anterior"
            onClick={() => mover(-1)}
            className="hidden sm:flex absolute -left-3 top-[70px] z-10 w-9 h-9 rounded-full bg-white shadow-md border border-zinc-200 items-center justify-center hover:bg-zinc-50"
          >
            <ChevronLeft className="h-5 w-5 text-zinc-700" />
          </button>

          <div
            ref={pista}
            className="flex gap-4 overflow-x-auto pb-3 px-1 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none' }}
          >
            {cargando
              ? [...Array(5)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[170px] sm:w-[200px]">
                    <div className="h-[140px] sm:h-[160px] rounded-2xl bg-zinc-200 animate-pulse" />
                    <div className="h-3 bg-zinc-200 rounded mt-3 w-3/4 mx-auto animate-pulse" />
                  </div>
                ))
              : productos.map((p) => (
                  <div
                    key={p.id}
                    data-tarjeta
                    className="flex-shrink-0 w-[170px] sm:w-[200px] snap-start bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col"
                  >
                    <div className="h-[140px] sm:h-[160px] rounded-t-2xl overflow-hidden bg-white flex items-center justify-center">
                      {p.imagenUrl && !imgError.has(p.id) ? (
                        <img
                          src={p.imagenUrl}
                          alt={p.nombre}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain p-2"
                          onError={() => setImgError((s) => new Set(s).add(p.id))}
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-zinc-300" />
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <p className="text-[13px] font-bold text-zinc-900 leading-snug line-clamp-2 min-h-[2.5em]">{p.nombre}</p>
                      <p className="text-base font-black text-[#123d83] mt-1">${p.precio.toFixed(2)}</p>
                      <button
                        onClick={() => goToComprar({ nombre: p.nombre, precio: p.precio, categoria: p.categoria })}
                        className="mt-auto pt-2"
                      >
                        <span className="w-full inline-flex items-center justify-center gap-1.5 bg-[#55b949] hover:bg-[#3f9a35] text-white text-xs font-bold py-2 rounded-xl transition-colors">
                          <ShoppingCart className="h-3.5 w-3.5" /> Comprar
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
          </div>

          <button
            aria-label="Siguiente"
            onClick={() => mover(1)}
            className="hidden sm:flex absolute -right-3 top-[70px] z-10 w-9 h-9 rounded-full bg-white shadow-md border border-zinc-200 items-center justify-center hover:bg-zinc-50"
          >
            <ChevronRight className="h-5 w-5 text-zinc-700" />
          </button>
        </div>
      </div>
    </section>
  );
}
