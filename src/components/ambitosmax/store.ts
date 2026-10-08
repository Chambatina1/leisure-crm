import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PublicView = 'home' | 'tienda' | 'combustible' | 'rastreador' | 'chat' | 'registro' | 'pedido-public' | 'reserva-cilindro';
export type AdminView = 'dashboard' | 'pedidos' | 'tracking' | 'config' | 'pedido-detail' | 'pedido-form' | 'pedido-edit' | 'tienda-admin' | 'combustible-admin' | 'ai-training' | 'apariencia' | 'users' | 'emails' | 'cilindros';
export type AppMode = 'public' | 'admin';

interface UserData {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
}

interface ProductPreview {
  nombre: string;
  precio: number;
  categoria: string;
}

interface AppState {
  // Auth - Admin
  isAdmin: boolean;
  isLoggedIn: boolean;
  login: (password: string) => Promise<{ ok: boolean; error?: string }>;
  verifySession: () => Promise<void>;
  logout: () => void;

  // Auth - User registration
  currentUser: UserData | null;
  setCurrentUser: (user: UserData | null) => void;
  showRegisterDialog: boolean;
  setShowRegisterDialog: (show: boolean) => void;
  // Compra que se retoma después de registrarse / iniciar sesión
  compraPendiente: { tipo: 'producto'; producto: ProductPreview } | { tipo: 'pedido' } | { tipo: 'vista'; vista: PublicView } | null;
  pedirRegistro: (pendiente: AppState['compraPendiente']) => void;
  continuarCompra: () => void;
  syncCliente: () => Promise<void>;
  logoutCliente: () => void;

  // Mode
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // Navigation - public
  currentView: PublicView;
  setCurrentView: (view: PublicView) => void;

  // Navigation - admin
  adminView: AdminView;
  setAdminView: (view: AdminView) => void;

  // Login dialog
  showLoginDialog: boolean;
  setShowLoginDialog: (show: boolean) => void;
  pendingAdminView: AdminView | null;
  setPendingAdminView: (view: AdminView | null) => void;

  // Shared state
  selectedPedidoId: number | null;
  setSelectedPedidoId: (id: number | null) => void;

  // Pre-fill purchase form from store
  selectedProduct: ProductPreview | null;
  setSelectedProduct: (product: ProductPreview | null) => void;

  // Actions
  goToPedidoDetail: (id: number) => void;
  goToPedidoEdit: (id: number) => void;
  goToNuevoPedido: () => void;
  goToComprar: (product: ProductPreview) => void;
  goBackToPublic: () => void;
  goToAdmin: () => void;
}

const STORAGE_KEY = 'ambitosmax-storage-v2';

// Safety: clear corrupted localStorage on load
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !('state' in parsed)) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth - Admin
      isAdmin: false,
      isLoggedIn: false,
      login: async (password: string) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok || !json.ok) {
            return { ok: false, error: json.error || 'Contraseña incorrecta' };
          }
          const pending = get().pendingAdminView;
          set({
            isLoggedIn: true,
            isAdmin: true,
            mode: 'admin',
            adminView: pending || 'dashboard',
            showLoginDialog: false,
            pendingAdminView: null,
          });
          return { ok: true };
        } catch {
          return { ok: false, error: 'No se pudo conectar con el servidor' };
        }
      },
      verifySession: async () => {
        if (!get().isLoggedIn) return;
        try {
          const res = await fetch('/api/auth/me');
          const json = await res.json();
          if (!json.isAdmin) {
            set({ isLoggedIn: false, isAdmin: false, mode: 'public', adminView: 'dashboard' });
          }
        } catch {
          /* sin conexión: no cambiar estado */
        }
      },
      logout: () => {
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        set({
          isLoggedIn: false,
          isAdmin: false,
          mode: 'public',
          adminView: 'dashboard',
          pendingAdminView: null,
          showLoginDialog: false,
        });
      },

      // Auth - User registration
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      showRegisterDialog: false,
      setShowRegisterDialog: (show) => set({ showRegisterDialog: show }),
      compraPendiente: null,
      pedirRegistro: (pendiente) => set({ compraPendiente: pendiente, showRegisterDialog: true }),
      continuarCompra: () => {
        const p = get().compraPendiente;
        set({ compraPendiente: null, showRegisterDialog: false });
        if (!p) return;
        if (p.tipo === 'producto') get().goToComprar(p.producto);
        else if (p.tipo === 'pedido') get().goToNuevoPedido();
        else set({ currentView: p.vista });
      },
      syncCliente: async () => {
        try {
          const r = await fetch('/api/users/me');
          const j = await r.json();
          set({ currentUser: j?.data ?? null });
        } catch {
          /* sin conexión: no tocar */
        }
      },
      logoutCliente: () => {
        fetch('/api/users/logout', { method: 'POST' }).catch(() => {});
        set({ currentUser: null });
      },

      // Mode
      mode: 'public',
      setMode: (mode) => set({ mode }),

      // Public navigation
      currentView: 'home',
      setCurrentView: (view) => set({ currentView: view }),

      // Admin navigation
      adminView: 'dashboard',
      setAdminView: (view) => set({ adminView: view }),

      // Login dialog
      showLoginDialog: false,
      setShowLoginDialog: (show) => set({ showLoginDialog: show }),
      pendingAdminView: null,
      setPendingAdminView: (view) => set({ pendingAdminView: view }),

      // Shared state
      selectedPedidoId: null,
      setSelectedPedidoId: (id) => set({ selectedPedidoId: id }),

      // Pre-fill purchase form from store
      selectedProduct: null,
      setSelectedProduct: (product) => set({ selectedProduct: product }),

      // Actions
      goToPedidoDetail: (id) =>
        set({ adminView: 'pedido-detail', selectedPedidoId: id }),
      goToPedidoEdit: (id) =>
        set({ adminView: 'pedido-edit', selectedPedidoId: id }),
      goToNuevoPedido: () => {
        if (get().mode !== 'admin' && !get().currentUser) {
          get().pedirRegistro({ tipo: 'pedido' });
          return;
        }
        set({ selectedProduct: null });
        const currentMode = get().mode;
        if (currentMode === 'admin') {
          set({ adminView: 'pedido-form', selectedPedidoId: null });
        } else {
          set({ currentView: 'pedido-public' });
        }
      },
      goToComprar: (product) => {
        // Nadie compra sin estar registrado (el servidor también lo exige)
        if (get().mode !== 'admin' && !get().currentUser) {
          get().pedirRegistro({ tipo: 'producto', producto: product });
          return;
        }
        // El cilindro de gas tiene su propio flujo de reserva con PIN y cierre diario
        if (/CILINDRO/i.test(product.nombre) && get().mode !== 'admin') {
          set({ selectedProduct: product, currentView: 'reserva-cilindro' });
          return;
        }
        // Diésel / gasolina: se venden en el sistema de Combustible (botón "Comprar combustible")
        if (
          get().mode !== 'admin' &&
          (/DI[EÉ]SEL|GASOLINA|COMBUSTIBLE/i.test(product.nombre) || product.categoria === 'combustible')
        ) {
          set({ selectedProduct: null, currentView: 'combustible' });
          return;
        }
        set({ selectedProduct: product, selectedPedidoId: null });
        const currentMode = get().mode;
        if (currentMode === 'admin') {
          set({ adminView: 'pedido-form' });
        } else {
          set({ currentView: 'pedido-public' });
        }
      },
      goBackToPublic: () =>
        set({ mode: 'public', adminView: 'dashboard' }),
      goToAdmin: () => {
        const { isLoggedIn } = get();
        if (isLoggedIn) {
          set({ mode: 'admin', adminView: 'dashboard' });
        } else {
          set({ showLoginDialog: true, pendingAdminView: 'dashboard' });
        }
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAdmin: state.isAdmin,
        isLoggedIn: state.isLoggedIn,
      }),
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            return JSON.parse(str);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch { /* storage full or unavailable */ }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch { /* ignore */ }
        },
      },
    }
  )
);
