'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { usePedidosStore, type Pedido } from './pedidos-provider';

interface StatsData {
  totalPedidos: number;
  porEstado: Record<string, number>;
  ultimosPedidos: Pedido[];
}

const estadoBadgeVariant = (estado: string) => {
  switch (estado) {
    case 'pendiente':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
    case 'en_proceso':
      return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800';
    case 'entregado':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
    case 'cancelado':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
    default:
      return '';
  }
};

const estadoLabel = (estado: string) => {
  switch (estado) {
    case 'pendiente':
      return 'Pendiente';
    case 'en_proceso':
      return 'En Proceso';
    case 'entregado':
      return 'Entregado';
    case 'cancelado':
      return 'Cancelado';
    default:
      return estado;
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export function Dashboard() {
  const { setCurrentView, setSelectedPedido, refreshTrigger } = usePedidosStore();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPedido = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setCurrentView('detalle');
  };

  const statCards = [
    {
      title: 'Total Pedidos',
      value: stats?.totalPedidos ?? 0,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Pendientes',
      value: stats?.porEstado?.pendiente ?? 0,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-950',
    },
    {
      title: 'En Proceso',
      value: stats?.porEstado?.en_proceso ?? 0,
      icon: Truck,
      color: 'text-sky-600',
      bgColor: 'bg-sky-100 dark:bg-sky-950',
    },
    {
      title: 'Entregados',
      value: stats?.porEstado?.entregado ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-950',
    },
  ];

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del sistema de pedidos
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-3xl font-bold">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Cancelled stat */}
      {(stats?.porEstado?.cancelado ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">Cancelados</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {stats?.porEstado?.cancelado ?? 0}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              Últimos 5 Pedidos
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('lista')}
            >
              Ver todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats?.ultimosPedidos && stats.ultimosPedidos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead className="hidden sm:table-cell">Destinatario</TableHead>
                  <TableHead className="hidden md:table-cell">Producto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.ultimosPedidos.map((pedido) => (
                  <TableRow
                    key={pedido.id}
                    className="cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleViewPedido(pedido)}
                  >
                    <TableCell className="font-medium">#{pedido.id}</TableCell>
                    <TableCell>{pedido.nombre_comprador}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {pedido.nombre_destinatario}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                      {pedido.producto}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={estadoBadgeVariant(pedido.estado)}
                      >
                        {estadoLabel(pedido.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatDate(pedido.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay pedidos registrados</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setCurrentView('crear')}
              >
                Crear primer pedido
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Export helper functions for reuse
export { estadoBadgeVariant, estadoLabel, formatDate };
