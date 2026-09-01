import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PublicView = 'home' | 'tienda' | 'rastreador' | 'chat' | 'registro' | 'pedido-public';
export type AdminView = 'dashboard' | 'pedidos' | 'tracking' | 'config' | 'pedido-detail' | 'pedido-form' | 'pedido-edit' | 'tienda-admin' | 'ai-training' | 'apariencia' | 'users' | 'emails';
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
  login: (password: string) => boolean;
  logout: () => void;

  // Auth - User registration
  currentUser: UserData | null;
  setCurrentUser: (user: UserData | null) => void;
  showRegisterDialog: boolean;
  setShowRegisterDialog: (show: boolean) => void;

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

const ADMIN_PASSWORD = 'leisure-exporting2024';
const STORAGE_KEY = 'leisure-exporting-storage-v2';

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
      login: (password: string) => {
        if (password === ADMIN_PASSWORD) {
          const pending = get().pendingAdminView;
          set({
            isLoggedIn: true,
            isAdmin: true,
            mode: 'admin',
            adminView: pending || 'dashboard',
            showLoginDialog: false,
            pendingAdminView: null,
          });
          return true;
        }
        return false;
      },
      logout: () => {
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
        set({ selectedProduct: null });
        const currentMode = get().mode;
        if (currentMode === 'admin') {
          set({ adminView: 'pedido-form', selectedPedidoId: null });
        } else {
          set({ currentView: 'pedido-public' });
        }
      },
      goToComprar: (product) => {
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
