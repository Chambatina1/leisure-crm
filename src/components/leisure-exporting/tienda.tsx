'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Bike, Box, Sun, Zap, ShoppingCart, ImageIcon, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Product { id: number; nombre: string; descripcion: string | null; precio: number; categoria: string; imagenUrl: string | null; tiktokUrl: string | null; }
interface GroupedProducts { [category: string]: Product[]; }

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Truck; color: string; bgColor: string }> = {
  envios: { label: 'Envíos', icon: Truck, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  bicicletas: { label: 'Bicicletas', icon: Bike, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  cajas: { label: 'Cajas', icon: Box, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  solar: { label: 'Solar', icon: Sun, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  tiktok: { label: 'TikTok', icon: Zap, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  general: { label: 'General', icon: ShoppingCart, color: 'text-zinc-600', bgColor: 'bg-zinc-100' },
};
const DEFAULT_CONFIG = { label: 'General', icon: ShoppingCart, color: 'text-zinc-600', bgColor: 'bg-zinc-100' };
const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export function Tienda() {
  const { goToNuevoPedido, goToComprar } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [grouped, setGrouped] = useState<GroupedProducts>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('envios');
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/tienda');
        const json = await res.json();
        if (json.ok) {
          setProducts(json.data.products || []);
          setGrouped(json.data.grouped || {});
          const categories = Object.keys(json.data.grouped || {});
          if (categories.length > 0) setActiveTab(categories[0]);
        }
      } catch { toast.error('Error al cargar productos'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const handleImageError = (productId: number) => { setImgErrors((prev) => new Set(prev).add(productId)); };

  const handleComprar = (product: Product) => {
    goToComprar({
      nombre: product.nombre,
      precio: product.precio,
      categoria: product.categoria,
    });
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
    </div>
  );

  if (products.length === 0) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
      <motion.div {...fadeIn} transition={{ duration: 0.4 }}>
        <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4"><ShoppingCart className="h-8 w-8 text-zinc-300" /></div>
        <h2 className="text-xl font-semibold text-zinc-700">Tienda en preparación</h2>
        <p className="text-zinc-400 mt-2">Pronto tendremos productos disponibles para ti.</p>
      </motion.div>
    </div>
  );

  const categories = Object.keys(grouped);
  const tabConfigs = categories.map((cat) => ({ value: cat, config: CATEGORY_CONFIG[cat] || DEFAULT_CONFIG }));

  return (
    <motion.div {...fadeIn} transition={{ duration: 0.4 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Tienda</h1>
        <p className="text-zinc-500 mt-1">Nuestros productos y servicios con precios actualizados</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-100 p-1 flex-wrap h-auto gap-1">
          {tabConfigs.map(({ value, config }) => {
            const Icon = config.icon;
            return <TabsTrigger key={value} value={value} className="gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white"><Icon className="h-4 w-4" />{config.label}</TabsTrigger>;
          })}
        </TabsList>
        {tabConfigs.map(({ value }) => {
          const catProducts = grouped[value] || [];
          return (
            <TabsContent key={value} value={value}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catProducts.map((product) => {
                  const hasImage = product.imagenUrl && !imgErrors.has(product.id);
                  return (
                    <Card key={product.id} className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                      {hasImage ? (
                        <div className="w-full h-44 relative bg-zinc-100"><img src={product.imagenUrl!} alt={product.nombre} className="w-full h-full object-cover" onError={() => handleImageError(product.id)} /></div>
                      ) : (
                        <div className="w-full h-32 flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100"><div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center"><ImageIcon className="h-7 w-7 text-zinc-300" /></div></div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg leading-tight">{product.nombre}</CardTitle>
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs shrink-0">${product.precio.toFixed(2)}</Badge>
                        </div>
                        {product.descripcion && <CardDescription className="text-xs line-clamp-2">{product.descripcion}</CardDescription>}
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        {product.tiktokUrl && (
                          <a
                            href={product.tiktokUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Ver Link del Equipo
                          </a>
                        )}
                        <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm" onClick={() => handleComprar(product)}>
                          <ShoppingCart className="h-4 w-4 mr-1.5" />
                          {product.tiktokUrl ? 'Llenar Ficha de Compra' : 'Comprar'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
      <div className="md:hidden h-20" />
    </motion.div>
  );
}
