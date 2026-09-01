'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Upload,
  Loader2,
  Trash2,
  Search,
  Package,
  CheckCircle2,
  AlertCircle,
  Database,
  Pencil,
  Save,
  X,
  Truck,
  Building2,
  FileCheck,
  Clock,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface TrackingEntry {
  id: number;
  cpk: string;
  fecha: string | null;
  estado: string;
  descripcion: string | null;
  embarcador: string | null;
  consignatario: string | null;
  carnetPrincipal: string | null;
  createdAt: string;
}

// Predefined states with icons and colors for quick selection
const ESTADOS_PREDEFINIDOS = [
  { value: 'EN AGENCIA', label: 'En Agencia', color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200', icon: Building2 },
  { value: 'EN TRANSITO', label: 'En Tránsito', color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200', icon: Truck },
  { value: 'EN ADUANA', label: 'En Aduana', color: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200', icon: ShieldCheck },
  { value: 'EN DISTRIBUCION', label: 'En Distribución', color: 'bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200', icon: MapPin },
  { value: 'ENTREGADO', label: 'Entregado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200', icon: FileCheck },
  { value: 'PENDIENTE DESGRUPE', label: 'Pend. Desgrupe', color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200', icon: Clock },
];

export function TrackingUpload() {
  const [tsvData, setTsvData] = useState('');
  const [uploading, setUploading] = useState(false);
  const [entries, setEntries] = useState<TrackingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [clearDialog, setClearDialog] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Edit dialog state
  const [editEntry, setEditEntry] = useState<TrackingEntry | null>(null);
  const [editEstado, setEditEstado] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editConsignatario, setEditConsignatario] = useState('');
  const [editCarnet, setEditCarnet] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tracking');
      const json = await res.json();
      if (json.ok) setEntries(json.data);
    } catch {
      toast.error('Error al cargar tracking');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleUpload = async () => {
    if (!tsvData.trim()) return;
    setUploading(true);
    try {
      const res = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloque: tsvData }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`${json.count} CPK(s) cargados exitosamente`);
        setTsvData('');
        fetchEntries();
      } else {
        toast.error(json.error || 'Error al procesar datos');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      const res = await fetch('/api/tracking', { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) {
        toast.success('Todos los datos de tracking eliminados');
        setEntries([]);
        setClearDialog(false);
      } else {
        toast.error(json.error || 'Error al eliminar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setClearing(false);
    }
  };

  const openEditDialog = (entry: TrackingEntry) => {
    setEditEntry(entry);
    setEditEstado(entry.estado);
    setEditDescripcion(entry.descripcion || '');
    setEditConsignatario(entry.consignatario || '');
    setEditCarnet(entry.carnetPrincipal || '');
    setEditFecha(entry.fecha || '');
  };

  const closeEditDialog = () => {
    setEditEntry(null);
    setEditEstado('');
    setEditDescripcion('');
    setEditConsignatario('');
    setEditCarnet('');
    setEditFecha('');
  };

  const handleSaveEdit = async () => {
    if (!editEntry) return;
    if (!editEstado.trim()) {
      toast.error('El estado no puede estar vacío');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/tracking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editEntry.id,
          estado: editEstado,
          descripcion: editDescripcion,
          consignatario: editConsignatario,
          carnetPrincipal: editCarnet,
          fecha: editFecha,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`CPK ${editEntry.cpk} actualizado a "${editEstado}"`);
        closeEditDialog();
        fetchEntries();
      } else {
        toast.error(json.error || 'Error al actualizar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const filteredEntries = entries.filter(
    (e) =>
      e.cpk.toLowerCase().includes(filter.toLowerCase()) ||
      (e.consignatario && e.consignatario.toLowerCase().includes(filter.toLowerCase())) ||
      (e.estado && e.estado.toLowerCase().includes(filter.toLowerCase())) ||
      (e.carnetPrincipal && e.carnetPrincipal.includes(filter))
  );

  const getEstadoColor = (estado: string) => {
    const e = estado.toUpperCase();
    if (e.includes('ENTREGADO')) return 'bg-emerald-100 text-emerald-700';
    if (e.includes('TRANSITO') || e.includes('TRÁNSITO')) return 'bg-blue-100 text-blue-700';
    if (e.includes('ADUANA')) return 'bg-purple-100 text-purple-700';
    if (e.includes('PENDIENTE') || e.includes('DESGRUPE')) return 'bg-blue-100 text-blue-700';
    if (e.includes('DISTRIBUCION')) return 'bg-cyan-100 text-cyan-700';
    if (e.includes('EMBARCADO')) return 'bg-blue-100 text-blue-700';
    return 'bg-zinc-100 text-zinc-700';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 flex items-center gap-2">
          <Database className="h-7 w-7 text-blue-600" />
          Gestión de Tracking
        </h1>
        <p className="text-zinc-500 mt-1">Carga datos TSV o edita manualmente el estado de cada CPK</p>
      </div>

      {/* Upload Section */}
      <Card className="border-0 shadow-md mb-6">
        <CardHeader>
          <CardTitle className="text-base">Cargar Datos de Rastreo (TSV)</CardTitle>
          <CardDescription>
            Pega los datos TSV directamente desde la hoja de cálculo. Los datos se analizarán automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={`LEISURE EXPORTING MIAMI\tGEO MIA\t\tCPK-0264397\tPENDIENTE DESAGRUPE\t...\nLEISURE EXPORTING MIAMI\tGEO MIA\t\tCPK-0255247\tENTREGADO\t...`}
            value={tsvData}
            onChange={(e) => setTsvData(e.target.value)}
            rows={4}
            className="font-mono text-xs"
          />
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <Button
              onClick={handleUpload}
              disabled={uploading || !tsvData.trim()}
              className="bg-gradient-to-r from-blue-500 to-[#55b949] hover:from-[#071a46] hover:to-[#348f39] text-white"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Cargar Datos
            </Button>
            {entries.length > 0 && (
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setClearDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar Todo ({entries.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status message */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">{entries.length} CPK(s) en la base de datos</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Pencil className="h-3 w-3" />
            <span>Haz clic en el botón de editar para cambiar estados manualmente</span>
          </div>
        </div>
      )}

      {/* Filter */}
      {entries.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
          <Input
            placeholder="Filtrar por CPK, nombre, estado o carnet..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 border-blue-200 focus:border-[#123d83]"
          />
        </div>
      )}

      {/* Entries Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredEntries.length > 0 ? (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow className="bg-gradient-to-r from-blue-50 to-blue-50">
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>CPK</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden md:table-cell">Consignatario</TableHead>
                    <TableHead className="hidden lg:table-cell">Carnet</TableHead>
                    <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                    <TableHead className="w-16 text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry, idx) => (
                    <TableRow key={entry.id} className="hover:bg-blue-50/50 group">
                      <TableCell className="text-xs text-zinc-400">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-sm font-medium text-blue-700">
                        {entry.cpk}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getEstadoColor(entry.estado)} text-xs font-medium`}>
                          {entry.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-zinc-600 max-w-[200px] truncate">
                        {entry.consignatario || '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-zinc-500 font-mono">
                        {entry.carnetPrincipal || '-'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-zinc-400">
                        {entry.fecha || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(entry)}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 opacity-70 group-hover:opacity-100 transition-opacity"
                          title="Editar estado"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-blue-200 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No hay datos de tracking cargados</p>
              <p className="text-zinc-400 text-xs mt-1">
                Pega los datos TSV arriba para comenzar
              </p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-blue-200 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No hay resultados para el filtro</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Estado Dialog */}
      <Dialog open={!!editEntry} onOpenChange={(open) => { if (!open) closeEditDialog(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              Editar CPK {editEntry?.cpk}
            </DialogTitle>
            <DialogDescription>
              Cambia manualmente el estado y otros datos del paquete
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Quick estado selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Estado del Paquete</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ESTADOS_PREDEFINIDOS.map((estado) => {
                  const Icon = estado.icon;
                  const isSelected = editEstado.toUpperCase() === estado.value;
                  return (
                    <button
                      key={estado.value}
                      onClick={() => setEditEstado(estado.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? estado.color + ' ring-2 ring-blue-400 shadow-sm'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{estado.label}</span>
                    </button>
                  );
                })}
              </div>
              {/* Custom estado input */}
              <div className="mt-2">
                <Input
                  placeholder="O escribe un estado personalizado..."
                  value={editEstado}
                  onChange={(e) => setEditEstado(e.target.value)}
                  className="border-blue-200 focus:border-[#123d83]"
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Descripción / Notas</Label>
              <Textarea
                placeholder="Notas adicionales sobre el estado del paquete..."
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Consignatario & Carnet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Consignatario</Label>
                <Input
                  placeholder="Nombre del destinatario"
                  value={editConsignatario}
                  onChange={(e) => setEditConsignatario(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Carnet</Label>
                <Input
                  placeholder="Número de carnet"
                  value={editCarnet}
                  onChange={(e) => setEditCarnet(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fecha (YYYY-MM-DD)</Label>
              <Input
                placeholder="2025-01-15"
                value={editFecha}
                onChange={(e) => setEditFecha(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeEditDialog} className="gap-1">
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving || !editEstado.trim()}
              className="bg-gradient-to-r from-blue-500 to-[#55b949] hover:from-[#071a46] hover:to-[#348f39] text-white gap-1"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Dialog */}
      <Dialog open={clearDialog} onOpenChange={setClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar todos los datos de tracking?</DialogTitle>
            <DialogDescription>
              Se eliminarán {entries.length} entrada(s) de tracking de forma permanente. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClear} disabled={clearing}>
              {clearing ? 'Eliminando...' : 'Eliminar Todo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="md:hidden h-20" />
    </motion.div>
  );
}
