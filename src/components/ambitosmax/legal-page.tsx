import Link from 'next/link';

export interface SeccionLegal {
  titulo: string;
  parrafos: string[];
}

interface LegalPageProps {
  titulo: string;
  actualizado: string;
  en: SeccionLegal[];
  es: SeccionLegal[];
}

// Página legal sencilla (privacidad, términos). Texto en inglés primero, porque
// la revisan plataformas como Intuit, y debajo la versión en español.
export function LegalPage({ titulo, actualizado, en, es }: LegalPageProps) {
  const bloque = (secciones: SeccionLegal[]) =>
    secciones.map((s) => (
      <div key={s.titulo} className="mb-8">
        <h3 className="text-lg font-bold text-zinc-900 mb-2">{s.titulo}</h3>
        {s.parrafos.map((p, i) => (
          <p key={i} className="text-zinc-600 leading-relaxed mb-2">{p}</p>
        ))}
      </div>
    ));

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-zinc-100">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="font-black tracking-widest text-[#071a46]">AMBITOSMAX</Link>
          <div className="flex gap-4 text-sm font-semibold text-zinc-600">
            <Link href="/privacy" className="hover:text-[#123d83]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#123d83]">Terms</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-black text-zinc-900 mb-2">{titulo}</h1>
        <p className="text-sm text-zinc-500 mb-10">Last updated / Última actualización: {actualizado}</p>

        <section lang="en" className="mb-12">
          <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6">English</h2>
          {bloque(en)}
        </section>

        <section lang="es" className="border-t border-zinc-100 pt-10">
          <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6">Español</h2>
          {bloque(es)}
        </section>
      </main>

      <footer className="bg-zinc-50 border-t border-zinc-100 py-6 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} Leisure Exporting · Ambitosmax · <Link href="/privacy" className="hover:underline">Privacy</Link> · <Link href="/terms" className="hover:underline">Terms</Link> · <Link href="/" className="hover:underline">ambitosmax.com</Link>
      </footer>
    </div>
  );
}
