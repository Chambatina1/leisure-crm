import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Carrito de la tienda, compartido por la tienda, el icono del menú y el
// formulario de compra. Se guarda en el navegador para no perderlo al recargar.
export interface CartProduct {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  imagenUrl: string | null;
}
export interface CartItem {
  product: CartProduct;
  qty: number;
}

interface CartState {
  items: CartItem[];
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (product: CartProduct) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
}

export const CART_STORAGE_KEY = 'ambitosmax-carrito';

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      setOpen: (open) => set({ open }),
      add: (product) =>
        set((s) => {
          const found = s.items.find((i) => i.product.id === product.id);
          if (found) return { items: s.items.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)) };
          return { items: [...s.items, { product, qty: 1 }] };
        }),
      setQty: (id, qty) =>
        set((s) => ({
          items: qty <= 0 ? s.items.filter((i) => i.product.id !== id) : s.items.map((i) => (i.product.id === id ? { ...i, qty: Math.min(qty, 50) } : i)),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.product.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    // Se carga del navegador después de montar (CartSheet), para que el HTML del servidor coincida
    { name: CART_STORAGE_KEY, partialize: (s) => ({ items: s.items }), skipHydration: true },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0);
export const cartTotal = (items: CartItem[]) => items.reduce((s, i) => s + i.product.precio * i.qty, 0);
