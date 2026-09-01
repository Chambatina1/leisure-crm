'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Package,
  FileText,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { usePedidosStore, type Pedido } from './pedidos-provider';
import { estadoBadgeVariant, estadoLabel, formatDate } from './dashboard';
import { toast } from 'sonner';

export function PedidoDetail() {
  const {
    selectedPedido,
    setCurrentView,
    setSelectedPedido,
    triggerRefresh,
  } = usePedidosStore();

  const [pedido, setPedido] = useState<Pedido | null>(selectedPedido);
  const [loading, setLoading] = useState(!selectedPedido);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [changingEstado, setChangingEstado] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPedido) {
      setPedido(selectedPedido);
      setLoading(false);
    } else {
      // If no selectedPedido was passed (direct navigation), this shouldn't happen
      setCurrentView('lista');
    }
  }, [selectedPedido, setCurrentView]);

  const handleEdit = () => {
    setCurrentView('editar');
  };

  const handleDelete = async () => {
    if (!pedido) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/pedidos/${pedido.id}`, { method: 'DELETE' });
      const json = await res.json();

      if (json.success) {
        toast.success('Pedido eliminado exitosamente');
        setDeleteDialogOpen(false);
        setSelectedPedido(null);
        triggerRefresh();
        setCurrentView('lista');
      } else {
        toast.error(json.error || 'Error al eliminar el pedido');
      }
    } catch (error) {
      console.error('Error deleting pedido:', error);
      toast.error('Error al eliminar el pedido');
    } finally {
      setDeleting(false);
    }
  };

  const handleChangeEstado = async (nuevoEstado: string) => {
    if (!pedido) return;
    try {
      setChangingEstado(nuevoEstado);
      const res = await fetch(`/api/pedidos/${pedido.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(`Estado cambiado a "${estadoLabel(nuevoEstado)}"`);
        setPedido(json.data);
        setSelectedPedido(json.data);
        triggerRefresh();
      } else {
        toast.error(json.error || 'Error al cambiar el estado');
      }
    } catch (error) {
      console.error('Error changing estado:', error);
      toast.error('Error al cambiar el estado');
    } finally {
      setChangingEstado(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!pedido) return null;

  const estadosSiguientes: Record<string, string[]> = {
    pendiente: ['en_proceso', 'cancelado'],
    en_proceso: ['entregado', 'cancelado'],
    entregado: [],
    cancelado: ['pendiente'],
  };

  const nextEstados = estadosSiguientes[pedido.estado] || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedPedido(null);
              setCurrentView('lista');
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Pedido #{pedido.id}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Creado el {formatDate(pedido.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-sm px-3 py-1 ${estadoBadgeVariant(pedido.estado)}`}
          >
            {estadoLabel(pedido.estado)}
          </Badge>
        </div>
      </div>

      {/* Estado Actions */}
      {nextEstados.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground mr-2">
                Cambiar estado a:
              </span>
              {nextEstados.map((estado) => (
                <Button
                  key={estado}
                  variant="outline"
                  size="sm"
                  disabled={changingEstado !== null}
                  onClick={() => handleChangeEstado(estado)}
                  className={
                    changingEstado === estado ? 'opacity-50' : ''
                  }
                >
                  {changingEstado === estado && (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  )}
                  {estadoLabel(estado)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Comprador Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Datos del Comprador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{pedido.nombre_comprador}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium">{pedido.telefono_comprador}</p>
              </div>
            </div>
            {pedido.email_comprador && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{pedido.email_comprador}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Destinatario Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Datos del Destinatario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{pedido.nombre_destinatario}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium">{pedido.telefono_destinatario}</p>
              </div>
            </div>
            {pedido.carnet_destinatario && (
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Carnet de Identidad</p>
                  <p className="font-medium">{pedido.carnet_destinatario}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Dirección</p>
                <p className="font-medium">{pedido.direccion_destinatario}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product and Notes Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Producto y Notas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Package className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Producto</p>
              <p className="font-medium text-base">{pedido.producto}</p>
            </div>
          </div>
          {pedido.notas && (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p className="font-medium whitespace-pre-wrap">{pedido.notas}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Editar Pedido
        </Button>
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar Pedido
        </Button>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido #{pedido.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El pedido será eliminado permanentemente del
              sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
