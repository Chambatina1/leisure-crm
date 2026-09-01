'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CheckCircle,
  Clock,
  Truck,
  Archive,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  { value: 'en_proceso', label: 'En Proceso', color: 'bg-blue-100 text-blue-700', icon: ClipboardList },
  { value: 'en_transito', label: 'En Tránsito', color: 'bg-purple-100 text-purple-700', icon: Truck },
  { value: 'en_aduana', label: 'En Aduana', color: 'bg-orange-100 text-orange-700', icon: Archive },
  { value: 'entregado', label: 'Entregado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
];

const getEstadoInfo = (estado: string) =>
  ESTADOS.find(e => e.value === estado) || ESTADOS[0];

interface Pedido {
  id: number;
  nombreComprador: string;
  emailComprador: string | null;
  telefonoComprador: string;
  nombreDestinatario: string;
  telefonoDestinatario: string;
  carnetDestinatario: string | null;
  direccionDestinatario: string;
  producto: string;
  notas: string | null;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

export function PedidosList() {
  const { goToPedidoDetail, goToPedidoEdit, goToNuevoPedido } = useAppStore();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const limit = 10;

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (estadoFilter !== 'all') params.set('estado', estadoFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/pedidos?${params}`);
      const json = await res.json();
      if (json.ok) {
        setPedidos(json.data);
        setTotalPages(json.pagination.totalPages);
      }
    } catch {
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [page, estadoFilter, search]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pedidos/${deleteDialog}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) {
        toast.success('Pedido eliminado');
        fetchPedidos();
      } else {
        toast.error(json.error || 'Error al eliminar');
      }
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleting(false);
      setDeleteDialog(null);
    }
  };

  const handleEstadoChange = async (id: number, newEstado: string) => {
    try {
      const res = await fetch(`/api/pedidos/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`Estado cambiado a "${ESTADOS.find(e => e.value === newEstado)?.label}"`);
        fetchPedidos();
      }
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Pedidos</h1>
          <p className="text-zinc-500 mt-1">Gestión de envíos y paquetes</p>
        </div>
        <Button onClick={goToNuevoPedido} className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Buscar por nombre, producto, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <Select value={estadoFilter} onValueChange={(v) => { setEstadoFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {ESTADOS.map(e => (
              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50">
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead className="hidden sm:table-cell">Destinatario</TableHead>
                  <TableHead className="hidden md:table-cell">Producto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : pedidos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-zinc-400">
                      No se encontraron pedidos
                    </TableCell>
                  </TableRow>
                ) : (
                  pedidos.map((pedido) => {
                    const estadoInfo = getEstadoInfo(pedido.estado);
                    return (
                      <TableRow key={pedido.id} className="hover:bg-zinc-50 cursor-pointer" onClick={() => goToPedidoDetail(pedido.id)}>
                        <TableCell className="font-mono text-xs text-zinc-500">#{pedido.id}</TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{pedido.nombreComprador}</div>
                          <div className="text-xs text-zinc-400 sm:hidden">{pedido.nombreDestinatario}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{pedido.nombreDestinatario}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-zinc-500 max-w-[200px] truncate">{pedido.producto}</TableCell>
                        <TableCell>
                          <Badge className={`${estadoInfo.color} text-xs font-medium`}>
                            {estadoInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-zinc-400">
                          {new Date(pedido.createdAt).toLocaleDateString('es-CU')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => goToPedidoDetail(pedido.id)}>
                                <Eye className="h-4 w-4 mr-2" /> Ver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => goToPedidoEdit(pedido.id)}>
                                <Pencil className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEstadoChange(pedido.id, pedido.estado === 'entregado' ? 'pendiente' : 'entregado')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {pedido.estado === 'entregado' ? 'Marcar Pendiente' : 'Marcar Entregado'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => { setDeleteDialog(pedido.id); }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-zinc-50">
              <p className="text-sm text-zinc-500">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar pedido #{deleteDialog}?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El pedido será eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="md:hidden h-20" />
    </motion.div>
  );
}
