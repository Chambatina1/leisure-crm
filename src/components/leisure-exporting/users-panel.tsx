'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Search,
  Download,
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Package,
  Eye,
  UserCheck,
  UserX,
  Loader2,
  X,
  FileDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  isActive: boolean;
  registeredAt: string;
  updatedAt: string;
  pedidos: { id: number }[];
}

export function UsersPanel() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.ok) setUsers(json.data);
      else toast.error(json.error || 'Error al cargar usuarios');
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const toggleActive = async (user: UserData) => {
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(user.isActive ? 'Usuario desactivado' : 'Usuario activado');
        loadUsers();
        if (selectedUser?.id === user.id) {
          setSelectedUser({ ...user, isActive: !user.isActive });
        }
      } else {
        toast.error(json.error || 'Error al cambiar estado');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setTogglingId(null);
    }
  };

  const exportCSV = () => {
    if (users.length === 0) {
      toast.error('No hay usuarios para exportar');
      return;
    }

    const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Ciudad', 'Estado', 'Registro', 'Pedidos'];
    const rows = users.map((u) => [
      u.id,
      `"${u.nombre}"`,
      `"${u.email}"`,
      `"${u.telefono || ''}"`,
      `"${u.ciudad || ''}"`,
      u.isActive ? 'Activo' : 'Inactivo',
      new Date(u.registeredAt).toLocaleDateString('es-CU'),
      u.pedidos?.length || 0,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios-leisure-exporting-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${users.length} usuarios exportados a CSV`);
  };

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.nombre.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.telefono && u.telefono.includes(term)) ||
        (u.ciudad && u.ciudad.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  // Stats
  const totalUsers = users.length;
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = users.filter(
    (u) => new Date(u.registeredAt) >= firstOfMonth
  ).length;
  const activeUsers = users.filter((u) => u.isActive).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-amber-500" />
            Usuarios
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona los usuarios registrados en la plataforma
          </p>
        </div>
        <Button
          onClick={exportCSV}
          variant="outline"
          disabled={users.length === 0}
          className="font-medium"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4 bg-amber-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-500" />
              <p className="text-xl sm:text-2xl font-bold">{totalUsers}</p>
            </div>
            <p className="text-xs text-muted-foreground">Total Usuarios</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-500" />
              <p className="text-xl sm:text-2xl font-bold">{activeUsers}</p>
            </div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4 bg-orange-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <p className="text-xl sm:text-2xl font-bold">{newThisMonth}</p>
            </div>
            <p className="text-xs text-muted-foreground">Nuevos este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, email, teléfono o ciudad..."
          className="pl-10"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Users Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">
              <Users className="h-10 w-10 mx-auto mb-3 text-zinc-300" />
              <p className="text-sm">
                {users.length === 0
                  ? 'No hay usuarios registrados'
                  : 'No se encontraron resultados'}
              </p>
            </div>
          ) : (
            <>
              <div className="px-4 py-2 bg-zinc-50 border-b text-xs text-muted-foreground">
                {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}{' '}
                {searchTerm ? 'encontrado' + (filtered.length !== 1 ? 's' : '') : 'registrado' + (filtered.length !== 1 ? 's' : '')}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50">
                      <TableHead className="w-12">ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                      <TableHead className="hidden lg:table-cell">Ciudad</TableHead>
                      <TableHead className="hidden sm:table-cell">Pedidos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filtered.map((user) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b hover:bg-zinc-50 transition-colors"
                        >
                          <TableCell className="font-mono text-xs text-zinc-400">
                            {user.id}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-amber-600">
                                  {user.nombre.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium">{user.nombre}</p>
                                <p className="text-xs text-zinc-400 md:hidden">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-zinc-600">
                            {user.email}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-zinc-500">
                            {user.telefono || '—'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-zinc-500">
                            {user.ciudad || '—'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge
                              variant="secondary"
                              className="bg-zinc-100 text-zinc-600 text-xs"
                            >
                              {user.pedidos?.length || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                user.isActive
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-zinc-100 text-zinc-500'
                              }`}
                            >
                              {user.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-zinc-500 hover:text-amber-600"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-8 w-8 p-0 ${
                                  user.isActive
                                    ? 'text-zinc-500 hover:text-red-600'
                                    : 'text-zinc-500 hover:text-emerald-600'
                                }`}
                                onClick={() => toggleActive(user)}
                                disabled={togglingId === user.id}
                              >
                                {togglingId === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : user.isActive ? (
                                  <UserX className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={() => setSelectedUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-amber-500" />
              Detalle del Usuario
            </DialogTitle>
            <DialogDescription>
              Información completa del usuario
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 mt-2">
              {/* Avatar */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-amber-600">
                    {selectedUser.nombre.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedUser.nombre}</p>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      selectedUser.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {selectedUser.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Info fields */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="text-sm font-medium">
                      {selectedUser.telefono || 'No especificado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dirección</p>
                    <p className="text-sm font-medium">
                      {selectedUser.direccion || 'No especificada'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ciudad</p>
                    <p className="text-sm font-medium">
                      {selectedUser.ciudad || 'No especificada'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Fecha de Registro
                    </p>
                    <p className="text-sm font-medium">
                      {new Date(selectedUser.registeredAt).toLocaleDateString(
                        'es-CU',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total de Pedidos
                    </p>
                    <p className="text-sm font-medium">
                      {selectedUser.pedidos?.length || 0} pedidos
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={`flex-1 font-medium ${
                    selectedUser.isActive
                      ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                      : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                  }`}
                  onClick={() => {
                    toggleActive(selectedUser);
                    setSelectedUser(null);
                  }}
                >
                  {selectedUser.isActive ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="md:hidden h-20" />
    </motion.div>
  );
}
