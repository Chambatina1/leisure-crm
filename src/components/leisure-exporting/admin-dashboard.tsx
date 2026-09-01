'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  ClipboardList,
  ArrowRight,
  BarChart3,
} from 'lucide-react';

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  { value: 'en_proceso', label: 'En Proceso', color: 'bg-blue-100 text-blue-700' },
  { value: 'en_transito', label: 'En Tránsito', color: 'bg-purple-100 text-purple-700' },
  { value: 'entregado', label: 'Entregado', color: 'bg-emerald-100 text-emerald-700' },
];

const getEstadoInfo = (estado: string) =>
  ESTADOS.find((e) => e.value === estado) || ESTADOS[0];

interface Stats {
  pedidos: {
    total: number;
    pendientes: number;
    enProceso: number;
    enTransito: number;
    enAduana: number;
    entregados: number;
    cancelados: number;
  };
  tracking: {
    total: number;
  };
  recentOrders: any[];
}

export function AdminDashboard() {
  const { setAdminView, goToPedidoDetail } = useAppStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (json.ok) setStats(json.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = stats
    ? [
        {
          title: 'Total Pedidos',
          value: stats.pedidos.total,
          icon: Package,
          color: 'bg-zinc-100',
          iconColor: 'text-zinc-600',
        },
        {
          title: 'Pendientes',
          value: stats.pedidos.pendientes + stats.pedidos.enProceso,
          icon: Clock,
          color: 'bg-amber-100',
          iconColor: 'text-amber-600',
        },
        {
          title: 'En Tránsito',
          value: stats.pedidos.enTransito + stats.pedidos.enAduana,
          icon: Truck,
          color: 'bg-purple-100',
          iconColor: 'text-purple-600',
        },
        {
          title: 'Entregados',
          value: stats.pedidos.entregados,
          icon: CheckCircle,
          color: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
        },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-amber-500" />
          Dashboard
        </h1>
        <p className="text-zinc-500 mt-1">Resumen general del sistema</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? [...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="border-0 shadow-md">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}
                      >
                        <Icon className={`h-5 w-5 ${card.iconColor}`} />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-zinc-900">
                      {card.value}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">{card.title}</p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card
          className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setAdminView('pedidos')}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Gestión de Pedidos</p>
                <p className="text-xs text-zinc-500">Crear, editar y gestionar pedidos</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-400" />
          </CardContent>
        </Card>
        <Card
          className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setAdminView('tracking')}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  Cargar Tracking{' '}
                  {stats && (
                    <Badge variant="secondary" className="ml-1 text-[10px] bg-emerald-100 text-emerald-700">
                      {stats.tracking.total} CPKs
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-zinc-500">Cargar datos de rastreo TSV</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-400" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Pedidos Recientes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-600 text-xs"
              onClick={() => setAdminView('pedidos')}
            >
              Ver todos <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : stats && stats.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50">
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead className="hidden sm:table-cell">Producto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((order: any) => (
                    <TableRow
                      key={order.id}
                      className="hover:bg-zinc-50 cursor-pointer"
                      onClick={() => goToPedidoDetail(order.id)}
                    >
                      <TableCell className="font-mono text-xs text-zinc-500">
                        #{order.id}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {order.nombreComprador}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-zinc-500 max-w-[200px] truncate">
                        {order.producto}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getEstadoInfo(order.estado).color} text-xs font-medium`}
                        >
                          {getEstadoInfo(order.estado).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-zinc-400">
                        {new Date(order.createdAt).toLocaleDateString('es-CU')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-400 text-sm">
              No hay pedidos todavía
            </div>
          )}
        </CardContent>
      </Card>

      <div className="md:hidden h-20" />
    </motion.div>
  );
}
