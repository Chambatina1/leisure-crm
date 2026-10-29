'use client';

import { useEffect } from 'react';
import { useAppStore } from './store';
import { useCartStore, cartCount, cartTotal } from './cart-store';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Minus, Plus, Trash2, CreditCard, ImageIcon, Lock } from 'lucide-react';

// Botón del carrito con el número de productos (para el menú y la tienda)
export function CartButton({ className = '' }: { className?: string }) {
  const items = useCartStore((s) => s.items);
  const setOpen = useCartStore((s) => s.setOpen);
  const n = cartCount(items);
  return (
    <button
      onClick={() => setOpen(true)}
      aria-label={`Abrir carrito (${n} productos)`}
      className={`relative inline-flex items-center justify-center rounded-lg p-2 text-[#071a46] hover:bg-blue-50 transition-colors ${className}`}
    >
      <ShoppingCart className="h-6 w-6" />
      {n > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#55b949] text-white text-xs font-bold flex items-center justify-center">
          {n}
        </span>
      )}
    </button>
  );
}

// Panel lateral del carrito: cambiar cantidades, quitar, ver total y pagar
export function CartSheet() {
  const { items, open, setOpen, setQty, remove } = useCartStore();
  const goToComprar = useAppStore((s) => s.goToComprar);
  const total = cartTotal(items);

  // Recuperar el carrito guardado en el navegador
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  const pagar = () => {
    if (!items.length) return;
    setOpen(false);
    // El formulario de compra toma todo el carrito y lleva a Stripe
    const p = items[0].product;
    goToComprar({ id: p.id, nombre: p.nombre, precio: p.precio, categoria: p.categoria });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-white p-0 flex flex-col">
        <div className="p-5 border-b border-zinc-100">
          <SheetTitle className="text-xl font-black text-[#071a46] flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Tu carrito
          </SheetTitle>
          <SheetDescription className="text-sm text-zinc-500">
            {items.length ? `${cartCount(items)} producto(s)` : 'Todavía no has añadido productos'}
          </SheetDescription>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-blue-300" />
              </div>
              <p className="text-zinc-500 mb-4">Toca &quot;Añadir al carrito&quot; en cualquier producto de la tienda.</p>
              <Button variant="outline" onClick={() => setOpen(false)}>Seguir comprando</Button>
            </div>
          ) : (
            items.map(({ product, qty }) => (
              <div key={product.id} className="flex gap-3 rounded-xl border border-zinc-100 p-3">
                <div className="w-16 h-16 shrink-0 rounded-lg bg-zinc-50 flex items-center justify-center overflow-hidden">
                  {product.imagenUrl ? (
                    <img src={product.imagenUrl} alt={product.nombre} className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-blue-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-zinc-900 leading-tight line-clamp-2">{product.nombre}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">${product.precio.toFixed(2)} c/u</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center rounded-lg border border-zinc-200">
                      <button onClick={() => setQty(product.id, qty - 1)} className="p-1.5 hover:bg-zinc-50" aria-label="Quitar uno">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{qty}</span>
                      <button onClick={() => setQty(product.id, qty + 1)} className="p-1.5 hover:bg-zinc-50" aria-label="Añadir uno">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-bold text-[#071a46]">${(product.precio * qty).toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={() => remove(product.id)} className="self-start p-1 text-zinc-400 hover:text-red-600" aria-label="Eliminar del carrito">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-zinc-100 p-5 space-y-3 bg-zinc-50">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 font-medium">Total</span>
              <span className="text-2xl font-black text-[#071a46]">${total.toFixed(2)}</span>
            </div>
            <Button onClick={pagar} className="w-full h-12 bg-[#55b949] hover:bg-[#348f39] text-white text-base font-bold">
              <CreditCard className="h-5 w-5 mr-2" /> Pagar con tarjeta
            </Button>
            <p className="text-xs text-zinc-500 text-center flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" /> Pago seguro con Stripe. Primero pedimos los datos de entrega.
            </p>
            <Button variant="ghost" onClick={() => setOpen(false)} className="w-full text-zinc-600">Seguir comprando</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
