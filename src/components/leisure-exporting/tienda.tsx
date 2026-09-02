'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Flame,
  Fuel,
  Bike,
  Truck,
  Sun,
  ShoppingCart,
  ImageIcon,
  Search,
  MapPin,
  Refrigerator,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

interface Product { id: number; nombre: string; descripcion: string | null; precio: number; categoria: string; imagenUrl: string | null; tiktokUrl: string | null; }
interface GroupedProducts { [category: string]: Product[]; }

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Truck; color: string; bgColor: string }> = {
  gas: { label: 'Balas de Gas', icon: Flame, color: 'text-[#123d83]', bgColor: 'bg-blue-100' },
  combustible: { label: 'Combustible', icon: Fuel, color: 'text-[#b45309]', bgColor: 'bg-amber-100' },
  motos: { label: 'Motos', icon: Bike, color: 'text-[#7c3aed]', bgColor: 'bg-purple-100' },
  motoselectricas: { label: 'Motos Eléctricas', icon: Bike, color: 'text-[#0e7490]', bgColor: 'bg-cyan-100' },
  triciclos: { label: 'Triciclos', icon: Truck, color: 'text-[#9333ea]', bgColor: 'bg-purple-100' },
  paneles: { label: 'Paneles Solares', icon: Sun, color: 'text-[#1f6b3a]', bgColor: 'bg-green-100' },
  plantas: { label: 'Plantas Eléctricas', icon: Wrench, color: 'text-[#b91c1c]', bgColor: 'bg-red-100' },
  electrodomesticos: { label: 'Electrodomésticos', icon: Refrigerator, color: 'text-[#123d83]', bgColor: 'bg-blue-100' },
  celulares: { label: 'Teléfonos', icon: ShoppingCart, color: 'text-[#075985]', bgColor: 'bg-sky-100' },
  alimentos: { label: 'Alimentos', icon: ShoppingCart, color: 'text-[#a16207]', bgColor: 'bg-yellow-100' },
  insumos: { label: 'Insumos', icon: Wrench, color: 'text-[#6b7280]', bgColor: 'bg-zinc-100' },
  bicicletas: { label: 'Bicicletas', icon: Bike, color: 'text-[#7c3aed]', bgColor: 'bg-purple-100' },
  ferreteria: { label: 'Ferretería', icon: Wrench, color: 'text-[#6b7280]', bgColor: 'bg-zinc-100' },
  envios: { label: 'Envíos', icon: Truck, color: 'text-[#123d83]', bgColor: 'bg-blue-100' },
  cajas: { label: 'Cajas', icon: ShoppingCart, color: 'text-[#123d83]', bgColor: 'bg-blue-100' },
  solar: { label: 'Energía Solar', icon: Sun, color: 'text-[#1f6b3a]', bgColor: 'bg-green-100' },
  general: { label: 'General', icon: ShoppingCart, color: 'text-zinc-600', bgColor: 'bg-zinc-100' },
};
const DEFAULT_CONFIG = { label: 'General', icon: ShoppingCart, color: 'text-zinc-600', bgColor: 'bg-zinc-100' };
const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const PROVINCIAS = ['La Habana','Pinar del Río','Artemisa','Mayabeque','Matanzas','Villa Clara','Cienfuegos','Sancti Spíritus','Ciego de Ávila','Camagüey','Las Tunas','Holguín','Granma','Santiago de Cuba','Guantánamo','Isla de la Juventud'];

export function Tienda() {
  const { goToNuevoPedido, goToComprar } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [grouped, setGrouped] = useState<GroupedProducts>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [province, setProvince] = useState('La Habana');
  const [cart, setCart] = useState<{product: Product; qty: number}[]>([]);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/tienda');
        const json = await res.json();
        if (json.ok) {
          setProducts(json.data.products || []);
          setGrouped(json.data.grouped || {});
        }
      } catch { toast.error('Error al cargar productos'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  // Carrito persistente
  useEffect(() => {
    const c = localStorage.getItem('leisure_cart');
    if (c) setCart(JSON.parse(c));
  }, []);
  useEffect(() => { localStorage.setItem('leisure_cart', JSON.stringify(cart)); }, [cart]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.product.precio * i.qty, 0);

  // Filtrar por categoría activa y búsqueda
  const [activeCat, setActiveCat] = useState('gas');
  const filtered = useMemo(() => {
    let list = grouped[activeCat] || [];
    if (search) list = list.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [grouped, activeCat, search]);

  function addToCart(p: Product) {
    setCart(prev => {
      const found = prev.find(i => i.product.id === p.id);
      if (found) return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product: p, qty: 1 }];
    });
    toast.success(`${p.nombre} añadido al carrito`);
  }

  function handleComprar(p: Product) {
    goToComprar({ nombre: p.nombre, precio: p.precio, categoria: p.categoria });
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
      </div>
    </div>
  );

  if (products.length === 0) return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-center">
      <motion.div {...fadeIn} transition={{ duration: 0.4 }}>
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="h-8 w-8 text-blue-300" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-700">Tienda en preparación</h2>
        <p className="text-zinc-400 mt-2">El administrador puede subir productos desde Configuración → Tienda</p>
      </motion.div>
    </div>
  );

  const categories = Object.keys(grouped);
  const tabConfigs = categories.map(cat => ({ value: cat, config: CATEGORY_CONFIG[cat] || DEFAULT_CONFIG }));

  return (
    <motion.div {...fadeIn} transition={{ duration: 0.4 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header con búsqueda y ubicación */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Tienda</h1>
            <p className="text-zinc-500 mt-1">Balas de gas, combustible, motos, paneles y más</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#123d83] text-white hover:bg-[#071a46] border-none gap-2"
            >
              <MapPin className="h-4 w-4" />
              <select
                value={province}
                onChange={e => setProvince(e.target.value)}
                className="bg-transparent text-white text-sm font-medium outline-none cursor-pointer"
              >
                {PROVINCIAS.map(p => <option key={p} value={p} className="text-black">{p}</option>
                )}
              </select>
            </Button>
          </div>
        </div>
      </div>

      {/* Categorías como botones */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {tabConfigs.map(({ value, config }) => {
          const Icon = config.icon;
          return (
            <button
              key={value}
              onClick={() => setActiveCat(value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeCat === value
                  ? 'bg-[#123d83] text-white shadow-md'
                  : 'bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {config.label}
              <span className={`text-xs ml-1 ${activeCat === value ? 'text-white/70' : 'text-zinc-400'}`}>
                ({(grouped[value] || []).length})
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.length === 0 ? (
          <p className="col-span-full text-center text-zinc-400 py-12">No hay productos en esta categoría.</p>
        ) : filtered.map((product) => {
          const hasImage = product.imagenUrl && !imgErrors.has(product.id);
          const config = CATEGORY_CONFIG[product.categoria] || DEFAULT_CONFIG;
          return (
            <Card key={product.id} className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              {hasImage ? (
                <div className="w-full h-44 relative bg-zinc-100">
                  <img src={product.imagenUrl!} alt={product.nombre} className="w-full h-full object-cover" onError={() => setImgErrors(prev => new Set(prev).add(product.id))} />
                </div>
              ) : (
                <div className={`w-full h-32 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100`}>
                  <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <ImageIcon className="h-7 w-7 text-blue-300" />
                  </div>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">{product.nombre}</CardTitle>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs shrink-0">
                    ${product.precio.toFixed(2)}
                  </Badge>
                </div>
                <Badge className={`${config.bgColor} ${config.color} text-[10px]`}>{config.label}</Badge>
                {product.descripcion && <CardDescription className="text-xs line-clamp-2">{product.descripcion}</CardDescription>}
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="text-xs text-emerald-600 font-medium">
                  ✓ Entrega en {province}
                </div>
                <Button
                  className="w-full bg-[#123d83] hover:bg-[#071a46] text-white text-sm"
                  onClick={() => addToCart(product)}
                >
                  <ShoppingCart className="h-4 w-4 mr-1.5" />
                  Añadir al carrito
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Carrito flotante */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#071a46] text-white px-6 py-4 flex items-center justify-between shadow-2xl">
          <div>
            <strong>{cartCount} producto(s)</strong>
            <span className="ml-3 text-emerald-300 font-bold">${cartTotal.toFixed(2)}</span>
          </div>
          <Button
            onClick={() => handleComprar(cart[0].product)}
            className="bg-[#55b949] hover:bg-[#348f39] text-white font-bold"
          >
            Checkout →
          </Button>
        </div>
      )}

      <div className="md:hidden h-20" />
    </motion.div>
  );
}
