import Link from 'next/link';
import { ShoppingCart, ArrowRight, Fuel, Flame } from 'lucide-react';
import { PAGINAS_SEO, SITIO } from '@/lib/seo-paginas';

interface SeoPageProps {
  titulo: string;
  subtitulo: string;
  descripcion: string;
  beneficios: string[];
  faqs: { q: string; a: string }[];
  ruta?: string; // p. ej. '/envios-a-cuba' — para migas de pan y enlaces internos
  children?: React.ReactNode; // contenido extra (productos, precios…)
}

// Página de aterrizaje renderizada en el servidor: todo el texto llega a Google en el HTML.
export function SeoPage({ titulo, subtitulo, descripcion, beneficios, faqs, ruta, children }: SeoPageProps) {
  const jsonLd: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ambitosmax', item: SITIO },
        ...(ruta ? [{ '@type': 'ListItem', position: 2, name: titulo, item: `${SITIO}${ruta}` }] : []),
      ],
    },
  ];
  if (faqs.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }
  const relacionadas = PAGINAS_SEO.filter((p) => p.url !== ruta).slice(0, 10);

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <nav className="bg-white border-b border-zinc-100">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="font-black tracking-widest text-[#071a46]">AMBITOSMAX</Link>
          <div className="flex gap-4 text-sm font-semibold text-zinc-600">
            <Link href="/?v=tienda" className="hover:text-[#123d83]">Tienda</Link>
            <Link href="/?v=combustible" className="hover:text-[#123d83]">Combustible</Link>
            <Link href="/?v=rastreador" className="hover:text-[#123d83]">Rastrear</Link>
          </div>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-[#071a46] via-[#123d83] to-[#1a4fa0] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-white/60 mb-3">
            <Link href="/" className="hover:underline">Inicio</Link> › <span>{titulo}</span>
          </p>
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">{titulo}</h1>
          <p className="text-lg md:text-xl text-white/80">{subtitulo}</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/?v=tienda" className="inline-flex items-center bg-[#55b949] hover:bg-[#348f39] text-white font-bold px-8 py-4 rounded-md">
              <ShoppingCart className="mr-2 h-5 w-5" /> Ver productos
            </Link>
            <Link href="/diesel-y-gasolina-en-cuba" className="inline-flex items-center bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 font-bold px-8 py-4 rounded-md">
              <Fuel className="mr-2 h-5 w-5" /> Diésel y gasolina
            </Link>
            <Link href="/balitas-de-gas-en-cuba" className="inline-flex items-center bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 font-bold px-8 py-4 rounded-md">
              <Flame className="mr-2 h-5 w-5" /> Balitas de gas
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-lg text-zinc-600 leading-relaxed mb-8">{descripcion}</p>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {beneficios.map((b, i) => (
            <div key={i} className="bg-zinc-50 rounded-xl p-5 border border-zinc-100">
              <p className="font-semibold text-zinc-800">✓ {b}</p>
            </div>
          ))}
        </div>

        {children}

        <div className="bg-[#071a46] rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-black text-white mb-2">¿Listo para comprar o enviar?</h2>
          <p className="text-white/60 mb-6">Tu familia en Cuba te espera</p>
          <Link href="/?v=tienda" className="inline-flex items-center bg-[#55b949] hover:bg-[#348f39] text-white font-bold px-10 py-4 text-lg rounded-md">
            Comenzar ahora <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>

        {faqs.length > 0 && (
          <div className="mb-12">
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

        <div className="border-t border-zinc-100 pt-8">
          <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-4">También te puede interesar</h2>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            {relacionadas.map((p) => (
              <li key={p.url}><Link href={p.url} className="text-[#123d83] hover:underline">{p.titulo}</Link></li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="bg-zinc-50 border-t border-zinc-100 py-6 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} Ambitosmax · Gas, combustible y envíos a Cuba · <Link href="/" className="hover:underline">ambitosmax.com</Link>
      </footer>
    </div>
  );
}
