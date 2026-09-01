import { create } from 'zustand';

export type ViewType = 'dashboard' | 'lista' | 'crear' | 'detalle' | 'editar';

export interface Pedido {
  id: number;
  nombre_comprador: string;
  email_comprador: string | null;
  telefono_comprador: string;
  nombre_destinatario: string;
  telefono_destinatario: string;
  carnet_destinatario: string | null;
  direccion_destinatario: string;
  producto: string;
  notas: string | null;
  estado: string;
  created_at: string;
}

interface PedidosState {
  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // Selected pedido
  selectedPedido: Pedido | null;
  setSelectedPedido: (pedido: Pedido | null) => void;

  // Filters
  filterEstado: string;
  setFilterEstado: (estado: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;

  // Refresh trigger
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const usePedidosStore = create<PedidosState>((set) => ({
  // Navigation
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),

  // Selected pedido
  selectedPedido: null,
  setSelectedPedido: (pedido) => set({ selectedPedido: pedido }),

  // Filters
  filterEstado: '',
  setFilterEstado: (estado) => set({ filterEstado: estado, currentPage: 1 }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),

  // Pagination
  currentPage: 1,
  setCurrentPage: (page) => set({ currentPage: page }),

  // Refresh trigger
  refreshTrigger: 0,
  triggerRefresh: () =>
    set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));
