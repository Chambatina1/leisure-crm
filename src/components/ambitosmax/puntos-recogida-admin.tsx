'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, MapPin, Minus, Plus, Save, Trash2 } from 'lucide-react';
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
  const sumar = async (p: PuntoRecogida, signo: 1 | -1) => {
    const c = Math.floor(Math.abs(Number(aSumar[p.id])));
    if (!c) { toast.error('Escribe cuántas balitas'); return; }
    const n = c * signo;
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
        setCambios(false);
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
          Escribe una cantidad y pulsa &quot;Añadir balitas&quot; cuando llegan a un punto o &quot;Quitar balitas&quot; para restarlas.
          La tienda vende la suma de los puntos activos y, al confirmarse un pago, se descuentan solas del punto que eligió el cliente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" />Cargando...</div>
        ) : (
          <>
            {puntos.map((p, i) => (
              <div key={p.id || `nuevo-${i}`} className="rounded-xl border-2 border-blue-100 bg-blue-50/40 p-3 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Input value={p.nombre} onChange={(e) => cambiar(i, { nombre: e.target.value })} placeholder="Nombre del punto" className="sm:flex-1 bg-white font-semibold" />
                  <Input value={p.lugar} onChange={(e) => cambiar(i, { lugar: e.target.value })} placeholder="Lugar (ej: Arroyo Arena, La Lisa)" className="sm:flex-1 bg-white" />
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <label className="flex items-center gap-2 text-sm text-zinc-600">
                      <Switch checked={p.activo} onCheckedChange={(v) => cambiar(i, { activo: v })} />Activo
                    </label>
                    <Button size="sm" variant="ghost" className="h-8 px-2 text-zinc-500 hover:text-red-600" onClick={() => quitar(i)} aria-label="Eliminar punto">
                      <Trash2 className="h-4 w-4 mr-1" />Eliminar punto
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-3 rounded-lg bg-white border border-zinc-200 p-3">
                  <div className="md:w-44 shrink-0">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Tiene ahora</p>
                    <p className="text-3xl font-black text-[#071a46] leading-none mt-1">
                      {typeof p.existencia === 'number' ? p.existencia : '—'}
                      <span className="text-sm font-semibold text-zinc-500"> {typeof p.existencia === 'number' ? 'balitas' : 'sin cantidad'}</span>
                    </p>
                  </div>
                  {p.id ? (
                    <div className="flex flex-1 flex-col sm:flex-row gap-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={aSumar[p.id] ?? ''}
                        onChange={(e) => setASumar((a) => ({ ...a, [p.id]: e.target.value }))}
                        placeholder="Cantidad"
                        className="sm:w-32 h-11 text-lg"
                        aria-label={`Cantidad de balitas para ${p.nombre}`}
                      />
                      <Button onClick={() => sumar(p, 1)} disabled={sumando === p.id} className="h-11 flex-1 bg-[#55b949] hover:bg-[#3f9a35] text-white font-bold">
                        {sumando === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}Añadir balitas
                      </Button>
                      <Button onClick={() => sumar(p, -1)} disabled={sumando === p.id} variant="outline" className="h-11 flex-1 border-red-300 text-red-700 hover:bg-red-50 font-bold">
                        <Minus className="h-4 w-4 mr-1" />Quitar balitas
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">Pulsa &quot;Guardar puntos&quot; para crear este punto y después añadirle balitas.</p>
                  )}
                </div>
                <label className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="shrink-0">Corregir la cantidad exacta:</span>
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
                    className="h-8 w-28 bg-white"
                    aria-label={`Cantidad exacta en ${p.nombre || 'este punto'}`}
                  />
                  <span>y Guardar puntos</span>
                </label>
              </div>
            ))}
            <p className="text-sm font-semibold text-[#071a46]">
              {total === null
                ? 'Total en la tienda: lo marca la existencia de cada cilindro (algún punto activo no tiene cantidad).'
                : `Total de balitas a la venta en la tienda: ${total} (suma de los puntos activos)`}
            </p>
            <div className="flex flex-wrap gap-2">
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
