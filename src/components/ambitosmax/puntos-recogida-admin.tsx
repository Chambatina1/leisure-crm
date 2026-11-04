'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, MapPin, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { PuntoRecogida } from '@/lib/puntos-gas';

// Puntos donde el cliente recoge las balitas de gas. Al pagar elige uno de los activos.
export function PuntosRecogidaAdmin() {
  const [puntos, setPuntos] = useState<PuntoRecogida[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cambios, setCambios] = useState(false);

  useEffect(() => {
    fetch('/api/tienda/admin/puntos')
      .then((r) => r.json())
      .then((j) => { if (j.ok) setPuntos(j.data); else toast.error('No se pudieron cargar los puntos'); })
      .catch(() => toast.error('Error de conexión'))
      .finally(() => setLoading(false));
  }, []);

  const cambiar = (i: number, campo: Partial<PuntoRecogida>) => {
    setPuntos((ps) => ps.map((p, j) => (j === i ? { ...p, ...campo } : p)));
    setCambios(true);
  };
  const agregar = () => {
    setPuntos((ps) => [...ps, { id: '', nombre: '', lugar: '', activo: true }]);
    setCambios(true);
  };
  const quitar = (i: number) => {
    setPuntos((ps) => ps.filter((_, j) => j !== i));
    setCambios(true);
  };

  const guardar = async () => {
    if (puntos.some((p) => p.nombre.trim().length < 2)) { toast.error('Cada punto necesita un nombre'); return; }
    if (!puntos.some((p) => p.activo)) { toast.error('Deja al menos un punto activo, o nadie podrá pagar las balitas'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/tienda/admin/puntos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(puntos),
      });
      const j = await res.json();
      if (j.ok) { setPuntos(j.data); setCambios(false); toast.success('Puntos de recogida guardados'); }
      else toast.error(typeof j.error === 'string' ? j.error : 'Error al guardar');
    } catch { toast.error('Error de conexión'); }
    finally { setSaving(false); }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-600" />Puntos de recogida de balitas de gas</CardTitle>
        <CardDescription>El cliente elige uno de los puntos activos al pagar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" />Cargando...</div>
        ) : (
          <>
            {puntos.map((p, i) => (
              <div key={p.id || `nuevo-${i}`} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-zinc-100 p-2">
                <Input value={p.nombre} onChange={(e) => cambiar(i, { nombre: e.target.value })} placeholder="Nombre del punto" className="sm:flex-1" />
                <Input value={p.lugar} onChange={(e) => cambiar(i, { lugar: e.target.value })} placeholder="Lugar (ej: Arroyo Arena, La Lisa)" className="sm:flex-1" />
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <label className="flex items-center gap-2 text-sm text-zinc-600">
                    <Switch checked={p.activo} onCheckedChange={(v) => cambiar(i, { activo: v })} />Activo
                  </label>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-red-600" onClick={() => quitar(i)} aria-label="Quitar punto">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={agregar}><Plus className="h-4 w-4 mr-1" />Añadir punto</Button>
              <Button size="sm" onClick={guardar} disabled={saving || !cambios} className="bg-[#123d83] hover:bg-[#071a46] text-white">
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}Guardar puntos
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
