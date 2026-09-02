'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Plus, Pencil, Trash2, Loader2, Store, ExternalLink, ImageIcon, Save, Check, Upload, X,
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: number; nombre: string; descripcion: string | null; precio: number;
  categoria: string; tiktokUrl: string | null; imagenUrl: string | null;
  activo: boolean; orden: number;
}

const CATEGORIAS = [
  { value: 'gas', label: 'Balas de Gas' },
  { value: 'combustible', label: 'Combustible' },
  { value: 'motos', label: 'Motos' },
  { value: 'motoselectricas', label: 'Motos Eléctricas' },
  { value: 'triciclos', label: 'Triciclos' },
  { value: 'bicicletas', label: 'Bicicletas' },
  { value: 'paneles', label: 'Paneles Solares' },
  { value: 'plantas', label: 'Plantas Eléctricas' },
  { value: 'electrodomesticos', label: 'Electrodomésticos' },
  { value: 'celulares', label: 'Teléfonos' },
  { value: 'alimentos', label: 'Alimentos' },
  { value: 'insumos', label: 'Insumos' },
  { value: 'ferreteria', label: 'Ferretería' },
  { value: 'general', label: 'General' },
];

const CATEGORIA_COLORS: Record<string, string> = {
  gas: 'bg-blue-100 text-blue-700', combustible: 'bg-amber-100 text-amber-700',
  motos: 'bg-purple-100 text-purple-700', paneles: 'bg-green-100 text-green-700',
  motoselectricas: 'bg-cyan-100 text-cyan-700', triciclos: 'bg-purple-100 text-purple-700',
  bicicletas: 'bg-purple-100 text-purple-700', plantas: 'bg-red-100 text-red-700',
  electrodomesticos: 'bg-blue-100 text-blue-700', celulares: 'bg-sky-100 text-sky-700',
  alimentos: 'bg-yellow-100 text-yellow-800', insumos: 'bg-zinc-100 text-zinc-700',
  ferreteria: 'bg-zinc-100 text-zinc-700', general: 'bg-zinc-100 text-zinc-700',
};

interface ProductForm {
  nombre: string; descripcion: string; precio: string; categoria: string;
  tiktokUrl: string; imagenUrl: string; activo: boolean; orden: string;
}

const EMPTY_FORM: ProductForm = {
  nombre: '', descripcion: '', precio: '', categoria: 'general',
  tiktokUrl: '', imagenUrl: '', activo: true, orden: '0',
};

function safeErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null) {
    try { return Object.values(err as Record<string, unknown>).flat().map(String).join(', '); } catch { /* fall through */ }
  }
  return 'Error desconocido';
}

export function TiendaAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tienda/admin');
      const json = await res.json();
      if (json.ok) setProducts(json.data);
      else toast.error(safeErrorMessage(json.error || 'Error al cargar productos'));
    } catch { toast.error('Error de conexión'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setDialogOpen(true); };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      nombre: product.nombre, descripcion: product.descripcion || '',
      precio: String(product.precio), categoria: product.categoria,
      tiktokUrl: product.tiktokUrl || '', imagenUrl: product.imagenUrl || '',
      activo: product.activo, orden: String(product.orden),
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { toast.error(`Tipo no permitido (${file.type}). Usa JPG, PNG, GIF o WebP.`); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error(`Imagen muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo 8MB.`); return; }
    setUploadingImage(true);
    try {
      // La imagen se guarda como data URL dentro del producto (en la BD),
      // así sobrevive a los deploys de Render sin depender de almacenamiento externo.
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
        reader.readAsDataURL(file);
      });

      // Redimensionar y comprimir (los GIF animados no pueden pasar por canvas)
      let finalUrl = dataUrl;
      if (file.type !== 'image/gif') {
        finalUrl = await new Promise<string>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const MAX = 900;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            if (scale === 1 && dataUrl.length < 300 * 1024) { resolve(dataUrl); return; }
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(dataUrl); return; }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          };
          img.onerror = () => resolve(dataUrl);
          img.src = dataUrl;
        });
      }

      if (finalUrl.length > 1.5 * 1024 * 1024) {
        toast.error('La imagen sigue siendo muy grande después de comprimir. Prueba con una más pequeña.');
        return;
      }

      setForm((prev) => ({ ...prev, imagenUrl: finalUrl }));
      toast.success('Imagen lista — se guardará junto con el producto');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[Upload] Error:', errorMsg);
      toast.error(`Error al procesar imagen: ${errorMsg}`);
    } finally { setUploadingImage(false); }
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return; }
    const precio = parseFloat(form.precio);
    if (isNaN(precio) || precio < 0) { toast.error('Precio no válido'); return; }
    setSaving(true);
    try {
      const payload = { ...form, precio, orden: parseInt(form.orden) || 0 };
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch('/api/tienda/admin', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const json = await res.json();
      if (json.ok) { toast.success(editingId ? 'Producto actualizado' : 'Producto creado'); setDialogOpen(false); loadProducts(); }
      else { toast.error(safeErrorMessage(json.error || 'Error al guardar')); }
    } catch { toast.error('Error de conexión'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tienda/admin?id=${deleteId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) { toast.success('Producto eliminado'); setDeleteId(null); loadProducts(); }
      else { toast.error(safeErrorMessage(json.error || 'Error al eliminar')); }
    } catch { toast.error('Error de conexión'); }
    finally { setDeleting(false); }
  };

  const toggleActive = async (product: Product) => {
    try {
      const res = await fetch('/api/tienda/admin', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, activo: !product.activo }),
      });
      const json = await res.json();
      if (json.ok) { toast.success(product.activo ? 'Producto desactivado' : 'Producto activado'); loadProducts(); }
    } catch { toast.error('Error de conexión'); }
  };

  const filtered = filterCat === 'all' ? products : products.filter((p) => p.categoria === filterCat);
  const getCategoriaLabel = (val: string) => CATEGORIAS.find((c) => c.value === val)?.label || val;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Store className="h-7 w-7 text-blue-600" />Tienda</h2>
          <p className="text-sm text-muted-foreground">Gestiona los productos y servicios de la tienda</p>
        </div>
        <Button onClick={openCreate} className="bg-[#123d83] hover:bg-[#071a46] text-white font-semibold"><Plus className="h-4 w-4 mr-2" />Nuevo Producto</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Productos', value: products.length, bg: 'bg-blue-50' },
          { label: 'Activos', value: products.filter((p) => p.activo).length, bg: 'bg-emerald-50' },
          { label: 'Inactivos', value: products.filter((p) => !p.activo).length, bg: 'bg-zinc-50' },
          { label: 'Con Link de Compra', value: products.filter((p) => p.tiktokUrl).length, bg: 'bg-blue-50' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className={`p-3 sm:p-4 ${stat.bg} rounded-xl`}>
              <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Filtrar:</span>
        <Button size="sm" variant={filterCat === 'all' ? 'default' : 'outline'} className={filterCat === 'all' ? 'bg-[#123d83] hover:bg-[#071a46] text-white text-xs' : 'text-xs'} onClick={() => setFilterCat('all')}>Todos</Button>
        {CATEGORIAS.map((cat) => (
          <Button key={cat.value} size="sm" variant={filterCat === cat.value ? 'default' : 'outline'} className={filterCat === cat.value ? 'bg-[#123d83] hover:bg-[#071a46] text-white text-xs' : 'text-xs'} onClick={() => setFilterCat(cat.value)}>{cat.label}</Button>
        ))}
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-zinc-400"><Store className="h-10 h-10 mx-auto mb-3 text-zinc-300" /><p className="text-sm">No hay productos {filterCat !== 'all' ? 'en esta categoría' : ''}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50">
                    <TableHead className="w-12">Orden</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                    <TableHead className="hidden md:table-cell">Precio</TableHead>
                    <TableHead className="hidden lg:table-cell">Link Compra</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filtered.map((product) => (
                      <motion.tr key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b hover:bg-zinc-50 transition-colors">
                        <TableCell className="font-mono text-xs text-zinc-400">{product.orden}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.imagenUrl ? (
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-100 shrink-0"><img src={product.imagenUrl} alt={product.nombre} className="w-full h-full object-cover" /></div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><ImageIcon className="h-4 w-4 text-blue-400" /></div>
                            )}
                            <div>
                              <p className="text-sm font-medium">{product.nombre}</p>
                              {product.descripcion && <p className="text-xs text-zinc-400 max-w-[200px] truncate hidden sm:block">{product.descripcion}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell"><Badge variant="secondary" className={`text-xs ${CATEGORIA_COLORS[product.categoria] || 'bg-zinc-100 text-zinc-700'}`}>{getCategoriaLabel(product.categoria)}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell text-sm font-medium">${product.precio.toFixed(2)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {product.tiktokUrl ? (
                            <a href={product.tiktokUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#123d83] hover:text-blue-700"><ExternalLink className="h-3 w-3" />Ver Link</a>
                          ) : <span className="text-xs text-zinc-300">—</span>}
                        </TableCell>
                        <TableCell><Switch checked={product.activo} onCheckedChange={() => toggleActive(product)} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-[#123d83]" onClick={() => openEdit(product)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-red-600" onClick={() => setDeleteId(product.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            <DialogDescription>{editingId ? 'Modifica los datos del producto' : 'Completa los datos para crear un nuevo producto'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label className="text-xs font-medium">Nombre *</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del producto" /></div>
            <div className="space-y-2"><Label className="text-xs font-medium">Descripción</Label><Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del producto" rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-xs font-medium">Precio *</Label><Input type="number" step="0.01" min="0" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} placeholder="0.00" /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Orden</Label><Input type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} placeholder="0" /></div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Categoría</Label>
              <Select value={form.categoria} onValueChange={(val) => setForm({ ...form, categoria: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Imagen del Producto</Label>
              {form.imagenUrl && (
                <div className="relative w-full h-36 rounded-lg overflow-hidden bg-zinc-100 border">
                  <img src={form.imagenUrl} alt="Vista previa" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <button type="button" onClick={() => setForm({ ...form, imagenUrl: '' })} className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"><X className="h-4 w-4" /></button>
                </div>
              )}
              {!form.imagenUrl ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="relative border-2 border-dashed border-zinc-200 hover:border-blue-400 rounded-lg p-4 text-center cursor-pointer transition-colors bg-zinc-50 hover:bg-blue-50/30"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={async (e) => { e.preventDefault(); e.stopPropagation(); const file = e.dataTransfer.files[0]; if (file) await handleImageUpload(file); }}>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); e.target.value = ''; }} />
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2"><Loader2 className="h-8 w-8 text-blue-600 animate-spin" /><p className="text-xs text-zinc-500">Subiendo...</p></div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Upload className="h-5 w-5 text-[#123d83]" /></div>
                      <div><p className="text-sm font-medium text-zinc-700">Elegir archivo</p><p className="text-xs text-zinc-400">Cualquier formato</p></div>
                    </div>
                  )}
                </div>
                <div className="relative border-2 border-dashed border-green-200 hover:border-green-400 rounded-lg p-4 text-center cursor-pointer transition-colors bg-green-50/30" onClick={() => cameraInputRef.current?.click()}>
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); e.target.value = ''; }} />
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><Camera className="h-5 w-5 text-green-600" /></div>
                    <div><p className="text-sm font-medium text-zinc-700">Tomar foto</p><p className="text-xs text-zinc-400">Cámara del celular</p></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-36 rounded-lg overflow-hidden bg-zinc-100 border">
                <img src={form.imagenUrl} alt="Vista previa" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <button type="button" onClick={() => setForm({ ...form, imagenUrl: '' })} className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"><X className="h-4 w-4" /></button>
              </div>
            )}
              <details className="mt-1"><summary className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-600 transition-colors">O pegar URL de imagen...</summary><Input className="mt-1" value={form.imagenUrl} onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })} placeholder="https://..." /></details>
            </div>
            <div className="space-y-2"><Label className="text-xs font-medium">Link de Compra Directo</Label><Input value={form.tiktokUrl} onChange={(e) => setForm({ ...form, tiktokUrl: e.target.value })} placeholder="https://tu-tienda.com/producto/..." /></div>
            <div className="flex items-center gap-3 pt-2"><Switch checked={form.activo} onCheckedChange={(val) => setForm({ ...form, activo: val })} /><Label className="text-sm">Producto activo</Label></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.nombre.trim()} className="bg-[#123d83] hover:bg-[#071a46] text-white font-medium">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : <><Save className="h-4 w-4 mr-2" />{editingId ? 'Actualizar' : 'Crear'}</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => !deleting && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Eliminar Producto</DialogTitle><DialogDescription>¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Eliminando...</> : <><Trash2 className="h-4 w-4 mr-2" />Eliminar</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="md:hidden h-20" />
    </motion.div>
  );
}
