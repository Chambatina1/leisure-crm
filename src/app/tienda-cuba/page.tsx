import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPage } from '@/components/ambitosmax/seo-page';
import { db } from '@/lib/db';
import { SITIO } from '@/lib/seo-paginas';

// Se regenera cada hora con los productos activos de la tienda
export const revalidate = 3600;

const T = 'Tienda online para Cuba — Compra en EE.UU., entrega en Cuba';
const D =
  'Catálogo de Ambitosmax: electrodomésticos, plantas eléctricas, motos, bicicletas, teléfonos, alimentos y cilindros de gas para tu familia en Cuba. Precios en USD.';

export const metadata: Metadata = {
  title: T,
  description: D,
  keywords: ['tienda online Cuba', 'comprar para Cuba', 'electrodomésticos Cuba', 'plantas eléctricas Cuba', 'motos eléctricas Cuba', 'regalos para Cuba'],
  alternates: { canonical: '/tienda-cuba' },
  openGraph: { url: '/tienda-cuba', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Ambitosmax' }], title: T, description: D, type: 'website', siteName: 'Ambitosmax', locale: 'es_US' },
};

const ETIQUETAS: Record<string, string> = {
  combustible: 'Combustible y gas', electrodomesticos: 'Electrodomésticos', insumos: 'Insumos', plantas: 'Plantas eléctricas',
  motos: 'Motos', motoselectricas: 'Motos eléctricas', celulares: 'Teléfonos', bicicletas: 'Bicicletas', alimentos: 'Alimentos',
  triciclos: 'Triciclos', general: 'General',
};

function imagen(p: { id: number; imagenUrl: string | null; updatedAt: Date }) {
  if (!p.imagenUrl) return null;
  return p.imagenUrl.startsWith('data:') ? `/api/tienda/imagen/${p.id}?v=${new Date(p.updatedAt).getTime()}` : p.imagenUrl;
}

export default async function Page() {
  let productos: { id: number; nombre: string; descripcion: string | null; precio: number; categoria: string; imagenUrl: string | null; updatedAt: Date }[] = [];
  try {
    productos = await db.tiendaProduct.findMany({
      where: { activo: true },
      orderBy: [{ categoria: 'asc' }, { orden: 'asc' }],
      select: { id: true, nombre: true, descripcion: true, precio: true, categoria: true, imagenUrl: true, updatedAt: true },
    });
  } catch {
    productos = [];
  }
  const grupos = productos.reduce<Record<string, typeof productos>>((acc, p) => {
    (acc[p.categoria] ||= []).push(p);
    return acc;
  }, {});

  const lista = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Tienda Ambitosmax',
    itemListElement: productos.slice(0, 100).map((p, i) => {
      const img = imagen(p);
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.nombre,
          ...(p.descripcion ? { description: p.descripcion.slice(0, 300) } : {}),
          ...(img ? { image: img.startsWith('http') ? img : `${SITIO}${img}` } : {}),
          offers: { '@type': 'Offer', price: p.precio.toFixed(2), priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: `${SITIO}/tienda-cuba` },
        },
      };
    }),
  };

  return (
    <SeoPage
      ruta="/tienda-cuba"
      titulo="Tienda online para Cuba"
      subtitulo={`${productos.length} productos · compra en EE.UU. y tu familia recibe en Cuba`}
      descripcion="Elige el producto, págalo desde Estados Unidos y lo entregamos en Cuba. Electrodomésticos, plantas eléctricas, motos y bicicletas, teléfonos, alimentos, insumos y cilindros de gas."
      beneficios={['Precios en USD', 'Entrega en Cuba', 'Pago desde EE.UU.', 'Atención en español']}
      faqs={[]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(lista).replace(/</g, '\\u003c') }} />
      {Object.entries(grupos).map(([cat, items]) => (
        <div key={cat} className="mb-10">
          <h2 className="text-xl font-black text-zinc-900 mb-4">{ETIQUETAS[cat] || cat}</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((p) => {
              const img = imagen(p);
              return (
                <li key={p.id} className="border border-zinc-100 rounded-xl p-3 bg-white">
                  {img && <img src={img} alt={p.nombre} loading="lazy" className="w-full h-28 object-contain mb-2" />}
                  <h3 className="text-sm font-bold text-zinc-800 leading-snug">{p.nombre}</h3>
                  <p className="text-[#123d83] font-black mt-1">${p.precio.toFixed(2)}</p>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="text-center mb-12">
        <Link href="/?v=tienda" className="inline-block bg-[#55b949] hover:bg-[#3f9a35] text-white font-bold px-8 py-3 rounded-md">Comprar en la tienda</Link>
      </div>
    </SeoPage>
  );
}
