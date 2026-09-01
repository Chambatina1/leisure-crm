'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Brain,
  Search,
  Save,
  Check,
  Download,
  Upload,
  Send,
  ToggleLeft,
  Bot,
  Lightbulb,
  Database,
  Sparkles,
  MessageSquare,
  Tag,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface KnowledgeEntry {
  id: number;
  categoria: string;
  pregunta: string;
  respuesta: string;
  keywords: string[];
  activa: boolean;
  prioridad: number;
}

const CATEGORIAS = [
  'precios',
  'tracking',
  'contacto',
  'general',
  'solar',
  'bicicletas',
  'cajas',
  'tiktok',
  'promociones',
  'horarios',
  'aduana',
  'embalaje',
];

const CATEGORIA_COLORS: Record<string, string> = {
  precios: 'bg-emerald-100 text-emerald-700',
  tracking: 'bg-blue-100 text-blue-700',
  contacto: 'bg-amber-100 text-amber-700',
  general: 'bg-zinc-100 text-zinc-700',
  solar: 'bg-yellow-100 text-yellow-700',
  bicicletas: 'bg-orange-100 text-orange-700',
  cajas: 'bg-purple-100 text-purple-700',
  tiktok: 'bg-pink-100 text-pink-700',
  promociones: 'bg-red-100 text-red-700',
  horarios: 'bg-cyan-100 text-cyan-700',
  aduana: 'bg-rose-100 text-rose-700',
  embalaje: 'bg-teal-100 text-teal-700',
};

interface EntryForm {
  categoria: string;
  pregunta: string;
  respuesta: string;
  keywords: string;
  activa: boolean;
  prioridad: string;
}

const EMPTY_FORM: EntryForm = {
  categoria: 'general',
  pregunta: '',
  respuesta: '',
  keywords: '',
  activa: true,
  prioridad: '0',
};

export function AITrainingPanel() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EntryForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Test AI section
  const [testQuestion, setTestQuestion] = useState('');
  const [testAnswer, setTestAnswer] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [showTest, setShowTest] = useState(false);

  // Import/Export
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-knowledge');
      const json = await res.json();
      if (json.ok) setEntries(json.data);
      else toast.error(json.error || 'Error al cargar base de conocimiento');
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (entry: KnowledgeEntry) => {
    setEditingId(entry.id);
    setForm({
      categoria: entry.categoria,
      pregunta: entry.pregunta,
      respuesta: entry.respuesta,
      keywords: entry.keywords.join(', '),
      activa: entry.activa,
      prioridad: String(entry.prioridad),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.pregunta.trim() || !form.respuesta.trim()) {
      toast.error('Pregunta y respuesta son obligatorias');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        prioridad: parseInt(form.prioridad) || 0,
        keywords: form.keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
      };
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch('/api/ai-knowledge', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const json = await res.json();

      if (json.ok) {
        toast.success(editingId ? 'Entrada actualizada' : 'Entrada creada');
        setDialogOpen(false);
        loadEntries();
      } else {
        toast.error(json.error || 'Error al guardar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/ai-knowledge?id=${deleteId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('Entrada eliminada');
        setDeleteId(null);
        loadEntries();
      } else {
        toast.error(json.error || 'Error al eliminar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (entry: KnowledgeEntry) => {
    try {
      const res = await fetch('/api/ai-knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.id, activa: !entry.activa }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(entry.activa ? 'Entrada desactivada' : 'Entrada activada');
        loadEntries();
      }
    } catch {
      toast.error('Error de conexión');
    }
  };

  const handleTestAI = async () => {
    if (!testQuestion.trim()) return;
    setTestLoading(true);
    setTestAnswer('');
    try {
      const res = await fetch('/api/ai-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, pregunta: testQuestion }),
      });
      const json = await res.json();
      if (json.ok) {
        setTestAnswer(json.data.aiResponse || 'No se encontró respuesta relevante.');
      } else {
        setTestAnswer('Error: ' + (json.error || 'No se pudo procesar'));
      }
    } catch {
      setTestAnswer('Error de conexión');
    } finally {
      setTestLoading(false);
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(entries, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-knowledge-base.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Base de conocimiento exportada');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data)) throw new Error('Formato inválido');

        const res = await fetch('/api/ai-knowledge/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries: data }),
        });
        const json = await res.json();
        if (json.ok) {
          toast.success(`${json.data.count} entradas importadas`);
          loadEntries();
        } else {
          toast.error(json.error || 'Error al importar');
        }
      } catch {
        toast.error('Archivo JSON no válido');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered entries
  const filtered = entries.filter((entry) => {
    const matchCat = filterCat === 'all' || entry.categoria === filterCat;
    const matchSearch = !searchTerm.trim() ||
      entry.pregunta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.respuesta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.keywords.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Stats
  const totalEntries = entries.length;
  const activeEntries = entries.filter((e) => e.activa).length;
  const entriesPerCategory = CATEGORIAS.map((cat) => ({
    categoria: cat,
    count: entries.filter((e) => e.categoria === cat).length,
  })).filter((c) => c.count > 0);

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
            <Brain className="h-7 w-7 text-amber-500" />
            Entrenamiento IA
          </h2>
          <p className="text-sm text-muted-foreground">
            Administra la base de conocimiento del asistente virtual
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Importar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={entries.length === 0}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Exportar
          </Button>
          <Button
            onClick={openCreate}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva Entrada
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4 bg-amber-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-500" />
              <p className="text-xl sm:text-2xl font-bold">{totalEntries}</p>
            </div>
            <p className="text-xs text-muted-foreground">Total Entradas</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <p className="text-xl sm:text-2xl font-bold">{activeEntries}</p>
            </div>
            <p className="text-xs text-muted-foreground">Activas</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4 bg-orange-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-orange-500" />
              <p className="text-xl sm:text-2xl font-bold">
                {entriesPerCategory.length}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Categorías Usadas</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4 bg-zinc-50 rounded-xl">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-zinc-500" />
              <p className="text-xl sm:text-2xl font-bold">
                {Math.round((activeEntries / Math.max(totalEntries, 1)) * 100)}%
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Tasa Activa</p>
          </CardContent>
        </Card>
      </div>

      {/* Test AI Section */}
      <Card className="border-0 shadow-md">
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowTest(!showTest)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Probar Asistente IA</CardTitle>
                <CardDescription className="text-xs">
                  Escribe una pregunta y verifica cómo responde el asistente
                </CardDescription>
              </div>
            </div>
            {showTest ? (
              <ChevronUp className="h-5 w-5 text-zinc-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-zinc-400" />
            )}
          </div>
        </CardHeader>
        <AnimatePresence>
          {showTest && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="pt-0 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      value={testQuestion}
                      onChange={(e) => setTestQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTestAI()}
                      placeholder="Escribe una pregunta de prueba..."
                      className="pl-10"
                      disabled={testLoading}
                    />
                  </div>
                  <Button
                    onClick={handleTestAI}
                    disabled={testLoading || !testQuestion.trim()}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  >
                    {testLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {testAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-50 rounded-xl p-4 border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-semibold text-amber-600">
                        Respuesta IA
                      </span>
                    </div>
                    <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                      {testAnswer}
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por pregunta, respuesta o keywords..."
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
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {CATEGORIAS.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Knowledge Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">
              <Brain className="h-10 w-10 mx-auto mb-3 text-zinc-300" />
              <p className="text-sm">
                {entries.length === 0
                  ? 'No hay entradas en la base de conocimiento'
                  : 'No se encontraron resultados'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                    <TableHead>Pregunta</TableHead>
                    <TableHead className="hidden lg:table-cell">Keywords</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filtered.map((entry) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b hover:bg-zinc-50 transition-colors"
                      >
                        <TableCell className="font-mono text-xs text-zinc-400">
                          {entry.id}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${CATEGORIA_COLORS[entry.categoria] || 'bg-zinc-100 text-zinc-700'}`}
                          >
                            {entry.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <button
                              className="text-sm font-medium text-left hover:text-amber-600 transition-colors"
                              onClick={() =>
                                setExpandedId(
                                  expandedId === entry.id ? null : entry.id
                                )
                              }
                            >
                              {entry.pregunta.length > 60
                                ? entry.pregunta.substring(0, 60) + '...'
                                : entry.pregunta}
                            </button>
                            <AnimatePresence>
                              {expandedId === entry.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap max-w-md">
                                    <span className="font-semibold text-zinc-600">
                                      R:{' '}
                                    </span>
                                    {entry.respuesta}
                                  </p>
                                  {entry.keywords.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {entry.keywords.map((kw, i) => (
                                        <Badge
                                          key={i}
                                          variant="outline"
                                          className="text-[10px] px-1.5 py-0"
                                        >
                                          {kw}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-0.5 max-w-[160px]">
                            {entry.keywords.slice(0, 3).map((kw, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {kw}
                              </Badge>
                            ))}
                            {entry.keywords.length > 3 && (
                              <span className="text-[10px] text-zinc-400 self-center">
                                +{entry.keywords.length - 3}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              entry.prioridad >= 5
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-zinc-100 text-zinc-500'
                            }`}
                          >
                            {entry.prioridad}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={entry.activa}
                            onCheckedChange={() => toggleActive(entry)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-zinc-500 hover:text-amber-600"
                              onClick={() => openEdit(entry)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-zinc-500 hover:text-red-600"
                              onClick={() => setDeleteId(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      {/* Categories Breakdown */}
      {entriesPerCategory.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-500" />
              Entradas por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {entriesPerCategory.map(({ categoria, count }) => (
                <Badge
                  key={categoria}
                  variant="secondary"
                  className={`${CATEGORIA_COLORS[categoria] || 'bg-zinc-100 text-zinc-700'} text-xs px-2.5 py-1`}
                >
                  {categoria} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Entrada' : 'Nueva Entrada'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Modifica los datos de esta entrada de conocimiento'
                : 'Agrega nueva información al asistente virtual'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Categoría</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(val) => setForm({ ...form, categoria: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Prioridad</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={form.prioridad}
                  onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                  placeholder="0-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Pregunta *</Label>
              <Textarea
                value={form.pregunta}
                onChange={(e) => setForm({ ...form, pregunta: e.target.value })}
                placeholder="Escribe la pregunta que podría hacer un cliente..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Respuesta *</Label>
              <Textarea
                value={form.respuesta}
                onChange={(e) => setForm({ ...form, respuesta: e.target.value })}
                placeholder="Escribe la respuesta que dará el asistente..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Keywords (separados por coma)
              </Label>
              <Input
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="precio, envio, tarifa, costo..."
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Switch
                checked={form.activa}
                onCheckedChange={(val) => setForm({ ...form, activa: val })}
              />
              <Label className="text-sm">Entrada activa</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saving || !form.pregunta.trim() || !form.respuesta.trim()
              }
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Actualizar' : 'Crear'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => !deleting && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Entrada</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta entrada de conocimiento?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="md:hidden h-20" />
    </motion.div>
  );
}
