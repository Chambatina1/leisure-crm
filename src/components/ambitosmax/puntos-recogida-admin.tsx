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
  const [aSumar, setASumar] = useState<Record<string, string>>({});
  const [sumando, setSumando] = useState<string | null>(null);

  // Total que ve la tienda: la suma de los puntos activos (si todos llevan cantidad)
  const activos = puntos.filter((p) => p.activo);
  const total = activos.length && activos.every((p) => typeof p.existencia === 'number')
    ? activos.reduce((s, p) => s + (p.existencia as number), 0)
    : null;

  // Añade balitas a un punto en el servidor (no pisa lo que se haya vendido mientras tanto)
  const sumar = async (p: PuntoRecogida) => {
    const n = Math.floor(Number(aSumar[p.id]));
    if (!n) { toast.error('Escribe cuántas balitas añadir'); return; }
    if (cambios) { toast.error('Guarda primero los cambios de los puntos'); return; }
    setSumando(p.id);
    try {
      const res = await fetch('/api/tienda/admin/puntos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, sumar: n }),
      });
      const j = await res.json();
      if (j.ok) {
        setPuntos(j.data);
        setASumar((a) => ({ ...a, [p.id]: '' }));
        toast.success(`${n > 0 ? 'Añadidas' : 'Quitadas'} ${Math.abs(n)} balitas en ${p.nombre}`);
      } else toast.error(typeof j.error === 'string' ? j.error : 'Error al sumar');
    } catch { toast.error('Error de conexión'); }
    finally { setSumando(null); }
  };

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
    setPuntos((ps) => [...ps, { id: '', nombre: '', lugar: '', activo: true, existencia: null }]);
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
        <CardDescription>
          Asigna cuántas balitas tiene cada punto. La tienda muestra la suma de los puntos activos (para los dos cilindros) y, al
          confirmarse el pago, se descuentan del punto que eligió el cliente. Para recibir más balitas en un punto usa &quot;Añadir&quot;.
          Deja &quot;Hay ahora&quot; vacío para no poner límite.
        </CardDescription>
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
                <label className="flex items-center gap-2 text-sm text-zinc-600 sm:w-44">
                  <span className="shrink-0">Hay ahora</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={p.existencia ?? ''}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      cambiar(i, { existencia: v === '' ? null : Math.max(0, Math.floor(Number(v)) || 0) });
                    }}
                    placeholder="Sin límite"
                    aria-label={`Balitas disponibles en ${p.nombre || 'este punto'}`}
                  />
                </label>
                {p.id && (
                  <div className="flex items-center gap-1 sm:w-48">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={aSumar[p.id] ?? ''}
                      onChange={(e) => setASumar((a) => ({ ...a, [p.id]: e.target.value }))}
                      placeholder="Cantidad"
                      aria-label={`Balitas a añadir en ${p.nombre}`}
                    />
                    <Button size="sm" variant="outline" onClick={() => sumar(p)} disabled={sumando === p.id} className="shrink-0">
                      {sumando === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}Añadir
                    </Button>
                  </div>
                )}
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
            <p className="text-sm font-semibold text-[#071a46]">
              {total === null
                ? 'Total en la tienda: lo marca la existencia de cada cilindro (algún punto activo no tiene cantidad).'
                : `Total de balitas en la tienda: ${total} (suma de los puntos activos)`}
            </p>
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
