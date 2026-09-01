'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  { value: 'en_proceso', label: 'En Proceso', color: 'bg-blue-100 text-blue-700' },
  { value: 'en_transito', label: 'En Tránsito', color: 'bg-purple-100 text-purple-700' },
  { value: 'en_aduana', label: 'En Aduana', color: 'bg-orange-100 text-orange-700' },
  { value: 'entregado', label: 'Entregado', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-700' },
];

const getEstadoInfo = (estado: string) =>
  ESTADOS.find(e => e.value === estado) || ESTADOS[0];

export function PedidoDetail() {
  const { selectedPedidoId, setAdminView, goToPedidoEdit } = useAppStore();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPedido = async () => {
    if (!selectedPedidoId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pedidos/${selectedPedidoId}`);
      const json = await res.json();
      if (json.ok) setPedido(json.data);
      else toast.error('Pedido no encontrado');
    } catch {
      toast.error('Error al cargar pedido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedido();
  }, [selectedPedidoId]);

  const handleEstadoChange = async (newEstado: string) => {
    try {
      const res = await fetch(`/api/pedidos/${selectedPedidoId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`Estado cambiado a "${getEstadoInfo(newEstado).label}"`);
        fetchPedido();
      }
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/pedidos/${selectedPedidoId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) {
        toast.success('Pedido eliminado');
        setAdminView('pedidos');
      }
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-zinc-500">Pedido no encontrado</p>
        <Button variant="outline" onClick={() => setAdminView('pedidos')} className="mt-4">
          Volver a Pedidos
        </Button>
      </div>
    );
  }

  const estadoInfo = getEstadoInfo(pedido.estado);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setAdminView('pedidos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Pedido #{pedido.id}</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Creado: {new Date(pedido.createdAt).toLocaleDateString('es-CU', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => goToPedidoEdit(pedido.id)}>
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteDialog(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status */}
      <Card className="border-0 shadow-md mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-zinc-500 mb-1">Estado actual</p>
              <Badge className={`${estadoInfo.color} text-sm font-medium px-3 py-1`}>
                {estadoInfo.label}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ESTADOS.filter(e => e.value !== pedido.estado && e.value !== 'cancelado').map(e => (
                <Button
                  key={e.value}
                  variant="outline"
                  size="sm"
                  className={`text-xs h-7 ${e.color} border-0`}
                  onClick={() => handleEstadoChange(e.value)}
                >
                  {e.label}
                </Button>
              ))}
              {pedido.estado !== 'cancelado' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 bg-red-100 text-red-700 border-0"
                  onClick={() => handleEstadoChange('cancelado')}
                >
                  Cancelado
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprador */}
      <Card className="border-0 shadow-md mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-amber-500" />
            Datos del Comprador
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2.5">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-zinc-400 shrink-0" />
            <span className="text-zinc-700 font-medium">{pedido.nombreComprador}</span>
          </div>
          {pedido.emailComprador && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="text-zinc-500">{pedido.emailComprador}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
            <span className="text-zinc-500">{pedido.telefonoComprador}</span>
          </div>
        </CardContent>
      </Card>

      {/* Destinatario */}
      <Card className="border-0 shadow-md mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-500" />
            Datos del Destinatario
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2.5">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-zinc-400 shrink-0" />
            <span className="text-zinc-700 font-medium">{pedido.nombreDestinatario}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
            <span className="text-zinc-500">{pedido.telefonoDestinatario}</span>
          </div>
          {pedido.carnetDestinatario && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="text-zinc-500">Carnet: {pedido.carnetDestinatario}</span>
            </div>
          )}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
            <span className="text-zinc-500">{pedido.direccionDestinatario}</span>
          </div>
        </CardContent>
      </Card>

      {/* Producto */}
      <Card className="border-0 shadow-md mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-amber-500" />
            Detalles del Envío
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2.5">
          <div className="flex items-start gap-2 text-sm">
            <Package className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
            <span className="text-zinc-700 font-medium">{pedido.producto}</span>
          </div>
          {pedido.notas && (
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
              <span className="text-zinc-500">{pedido.notas}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar pedido #{pedido.id}?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El pedido será eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancelar</Button>
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
