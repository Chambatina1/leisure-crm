'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calculator, Download, Loader2, RefreshCw, Save, Search, Store } from 'lucide-react';
import { toast } from 'sonner';
import type { BalanceBalitas, BalancePunto, Cifras, FilaSerie } from '@/lib/contabilidad-balitas';

// Administrador de puntos de venta: indicadores contables de las balitas de gas.
// Se recalcula desde la base de datos al abrir y cada minuto.
const CADA_MS = 60_000;
const AZUL = '#123d83';

const usd = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fecha = (d: string) =>
  d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '';
const mesTxt = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('es-ES', { month: 'short', year: '2-digit', timeZone: 'UTC' });

type Periodo = 'diaria' | 'semanal' | 'mensual';

/** Rellena los días/semanas/meses sin ventas con 0 para que la gráfica no salte huecos. */
function completar(serie: FilaSerie[], tipo: Periodo, hoy: string, lunes: string, mes: string): FilaSerie[] {
  const mapa = new Map(serie.map((f) => [f.periodo, f]));
  const out: FilaSerie[] = [];
  const base = new Date(`${tipo === 'diaria' ? hoy : tipo === 'semanal' ? lunes : mes}T12:00:00Z`);
  const n = tipo === 'diaria' ? 31 : 12;
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    if (tipo === 'diaria') d.setUTCDate(d.getUTCDate() - i);
    else if (tipo === 'semanal') d.setUTCDate(d.getUTCDate() - 7 * i);
    else d.setUTCMonth(d.getUTCMonth() - i);
    const k = d.toISOString().slice(0, 10);
    out.push(mapa.get(k) || { periodo: k, compras: 0, balitas: 0, usd: 0 });
  }
  return out;
}

function Indicador({ titulo, c, nota }: { titulo: string; c: Cifras; nota?: string }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <p className="text-xs text-zinc-500">{titulo}</p>
      <p className="text-xl font-bold text-zinc-900">{usd(c.usd)}</p>
      <p className="text-xs text-zinc-600">
        {c.balitas} balita(s) · {c.compras} compra(s)
      </p>
      {nota && <p className="text-[11px] text-zinc-400 mt-0.5">{nota}</p>}
    </div>
  );
}

function FilaBalance({ etiqueta, valor, fuerte, signo }: { etiqueta: string; valor: string; fuerte?: boolean; signo?: string }) {
  return (
    <div className={`flex justify-between gap-3 py-1.5 ${fuerte ? 'border-t font-bold text-zinc-900' : 'text-zinc-700'}`}>
      <span>{etiqueta}</span>
      <span className="tabular-nums">{signo}{valor}</span>
    </div>
  );
}

function TarjetaPunto({ p }: { p: BalancePunto }) {
  const sinControl = p.existencia === null;
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Store className="h-4 w-4 text-[#123d83]" /> {p.nombre}
          {!p.activo && <span className="text-[11px] font-normal text-zinc-500 bg-zinc-100 rounded px-1.5">inactivo</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-blue-50 p-2">
            <p className="text-[11px] text-zinc-500">En el punto</p>
            <p className="text-lg font-bold">{sinControl ? '—' : p.existencia}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2">
            <p className="text-[11px] text-zinc-500">A la venta</p>
            <p className="text-lg font-bold">{p.disponibles ?? '—'}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-2">
            <p className="text-[11px] text-zinc-500">Por entregar</p>
            <p className="text-lg font-bold">{p.porEntregar.balitas}</p>
          </div>
        </div>
        {sinControl && <p className="text-xs text-amber-700">Este punto no tiene cantidad de balitas asignada (pestaña Puntos gas).</p>}
        {p.apartadas > 0 && <p className="text-xs text-zinc-500">{p.apartadas} apartada(s) por compras sin pagar de la última hora.</p>}
        <table className="w-full text-xs">
          <thead>
            <tr className="text-zinc-500 text-left">
              <th className="font-normal py-1">Periodo</th>
              <th className="font-normal text-right">Balitas</th>
              <th className="font-normal text-right">Compras</th>
              <th className="font-normal text-right">Ingresos</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {([['Hoy', p.hoy], ['Esta semana', p.semana], ['Este mes', p.mes], ['Desde el inicio', p.total]] as const).map(([t, c]) => (
              <tr key={t} className="border-t">
                <td className="py-1">{t}</td>
                <td className="text-right">{c.balitas}</td>
                <td className="text-right">{c.compras}</td>
                <td className="text-right font-semibold">{usd(c.usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-zinc-600">
          Entregadas: <b>{p.entregadas.balitas}</b> · Pendientes de pago (24 h): <b>{p.pendientes.compras}</b> ({usd(p.pendientes.usd)}) ·
          Anuladas: <b>{p.anuladas}</b> · Compradores: <b>{p.compradores}</b>
        </p>
      </CardContent>
    </Card>
  );
}

export function ContabilidadPuntos() {
  const [datos, setDatos] = useState<BalanceBalitas | null>(null);
  const [punto, setPunto] = useState('');
  const [periodo, setPeriodo] = useState<Periodo>('diaria');
  const [medida, setMedida] = useState<'usd' | 'balitas'>('usd');
  const [cargando, setCargando] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [costo, setCosto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [puntosLista, setPuntosLista] = useState<{ id: string; nombre: string }[]>([]);

  const cargar = useCallback(async (silencioso = false) => {
    try {
      const r = await fetch(`/api/cilindros/contabilidad${punto ? `?punto=${encodeURIComponent(punto)}` : ''}`, { cache: 'no-store' });
      const j = await r.json();
      if (j.ok) {
        setDatos(j.data);
        if (j.data.ganancia) setCosto((c) => (c === '' ? String(j.data.ganancia.costoBalita) : c));
        if (!punto) setPuntosLista(j.data.puntos.map((p: BalancePunto) => ({ id: p.id, nombre: p.nombre })));
      } else if (!silencioso) toast.error(j.error || 'No se pudo cargar el balance');
    } catch {
      if (!silencioso) toast.error('Error de conexión');
    } finally {
      setCargando(false);
    }
  }, [punto]);

  useEffect(() => {
    cargar();
    const t = setInterval(() => cargar(true), CADA_MS);
    return () => clearInterval(t);
  }, [cargar]);

  const serie = useMemo(
    () => (datos ? completar(datos.series[periodo], periodo, datos.hoy, datos.inicioSemana, datos.inicioMes) : []),
    [datos, periodo]
  );

  const compradores = useMemo(() => {
    const t = buscar.trim().toLowerCase();
    const d = t.replace(/\D/g, '');
    return (datos?.compradores || []).filter(
      (c) => !t || c.nombre.toLowerCase().includes(t) || (c.email || '').toLowerCase().includes(t) || (d.length >= 3 && c.telefono.replace(/\D/g, '').includes(d))
    );
  }, [datos, buscar]);

  const guardarCosto = async () => {
    const v = costo.trim() === '' ? null : Number(costo.replace(',', '.'));
    if (v !== null && !(v >= 0)) { toast.error('Escribe un costo válido'); return; }
    setGuardando(true);
    try {
      const r = await fetch('/api/cilindros/contabilidad', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ costoBalita: v }),
      });
      const j = await r.json();
      if (j.ok) { toast.success(v === null ? 'Costo borrado' : 'Costo guardado'); cargar(true); }
      else toast.error(j.error || 'No se pudo guardar');
    } catch { toast.error('Error de conexión'); }
    finally { setGuardando(false); }
  };

  const descargarCsv = () => {
    if (!datos) return;
    const q = (s: unknown) => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const lineas = [
      ['Punto', 'Hoy balitas', 'Hoy USD', 'Semana balitas', 'Semana USD', 'Mes balitas', 'Mes USD', 'Total balitas', 'Total USD', 'Por entregar', 'Entregadas', 'Pendiente pago USD', 'En el punto', 'A la venta'].map(q).join(','),
      ...datos.puntos.map((p) =>
        [p.nombre, p.hoy.balitas, p.hoy.usd, p.semana.balitas, p.semana.usd, p.mes.balitas, p.mes.usd, p.total.balitas, p.total.usd, p.porEntregar.balitas, p.entregadas.balitas, p.pendientes.usd, p.existencia ?? '', p.disponibles ?? ''].map(q).join(',')
      ),
      '',
      ['Comprador', 'Teléfono', 'Correo', 'Compras', 'Balitas', 'USD', 'Primera compra', 'Última compra'].map(q).join(','),
      ...datos.compradores.map((c) => [c.nombre, c.telefono, c.email, c.compras, c.balitas, c.usd, c.primera, c.ultima].map(q).join(',')),
    ];
    const blob = new Blob(['﻿' + lineas.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `balance-balitas-${datos.hoy}${punto ? '-' + punto : ''}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (cargando && !datos) {
    return (
      <div className="flex justify-center py-16 text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!datos) return <p className="py-10 text-center text-zinc-500">No se pudo cargar el balance.</p>;

  const t = datos.totales;
  const g = datos.ganancia;
  const etiquetaX = (d: string) => (periodo === 'mensual' ? mesTxt(d) : fecha(d));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Calculator className="h-6 w-6 text-[#123d83]" /> Puntos de venta
          </h1>
          <p className="text-sm text-zinc-500">
            Balance de las balitas de gas. Se actualiza solo cada minuto · última vez{' '}
            {new Date(datos.generado).toLocaleTimeString('es-ES', { timeZone: 'America/Havana', hour: '2-digit', minute: '2-digit' })} (hora de Cuba)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={punto}
            onChange={(e) => { setCargando(true); setPunto(e.target.value); }}
            className="h-9 rounded-md border bg-white px-2 text-sm"
            aria-label="Punto de venta"
          >
            <option value="">Todos los puntos</option>
            {puntosLista.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => { setCargando(true); cargar(); }} disabled={cargando}>
            <RefreshCw className={`h-4 w-4 mr-1 ${cargando ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={descargarCsv}>
            <Download className="h-4 w-4 mr-1" /> Excel (CSV)
          </Button>
        </div>
      </div>

      {/* Ventas por periodo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Indicador titulo="Vendido hoy" c={t.hoy} />
        <Indicador titulo="Esta semana" c={t.semana} nota={`desde el lunes ${fecha(datos.inicioSemana)}`} />
        <Indicador titulo="Este mes" c={t.mes} nota={`desde el ${fecha(datos.inicioMes)}`} />
        <Indicador titulo="Desde el inicio" c={t.total} />
      </div>

      {/* Balance financiero */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Balance financiero</CardTitle>
            <CardDescription>Solo cuenta compras con el Zelle confirmado.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <FilaBalance etiqueta="Ingresos cobrados (total)" valor={usd(t.total.usd)} />
            <FilaBalance etiqueta={`· Ya entregado (${t.entregadas.balitas} balitas)`} valor={usd(t.entregadas.usd)} />
            <FilaBalance etiqueta={`· Cobrado, por entregar (${t.porEntregar.balitas} balitas)`} valor={usd(t.porEntregar.usd)} />
            {g ? (
              <>
                <FilaBalance etiqueta={`Costo de lo vendido (${t.total.balitas} × ${usd(g.costoBalita)})`} valor={usd(g.costoVendido)} signo="− " />
                <FilaBalance etiqueta="Ganancia bruta" valor={usd(g.gananciaBruta)} fuerte />
                <FilaBalance etiqueta="Ganancia bruta de este mes" valor={usd(g.gananciaMes)} />
              </>
            ) : (
              <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                Para ver la ganancia escribe abajo cuánto te cuesta cada balita.
              </p>
            )}
            <div className="mt-3 border-t pt-2 space-y-1 text-zinc-700">
              <FilaBalance etiqueta={`Pendiente de cobro (24 h, ${t.pendientes.compras} compras)`} valor={usd(t.pendientes.usd)} />
              <FilaBalance etiqueta="Balitas en los puntos" valor={t.existencia === null ? 'sin cantidad asignada' : String(t.existencia)} />
              {g?.valorInventario != null && <FilaBalance etiqueta="Valor del inventario (a costo)" valor={usd(g.valorInventario)} />}
            </div>
            <div className="mt-3 flex items-end gap-2">
              <label className="flex-1 text-xs text-zinc-600">
                Costo por balita (USD, opcional)
                <Input inputMode="decimal" value={costo} onChange={(e) => setCosto(e.target.value)} placeholder="p. ej. 40" className="mt-1" />
              </label>
              <Button size="sm" onClick={guardarCosto} disabled={guardando}>
                {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Guardar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Compradores', t.compradores],
              ['Compran más de una vez', `${t.compradoresQueRepiten}${t.compradores ? ` (${Math.round((t.compradoresQueRepiten / t.compradores) * 100)}%)` : ''}`],
              ['Ticket promedio', usd(t.ticketPromedio)],
              ['Balitas por compra', t.balitasPorCompra],
              ['Precio medio por balita', usd(t.precioPromedio)],
              ['Promedio diario (31 días)', usd(datos.series.diaria.reduce((s, f) => s + f.usd, 0) / 31)],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-lg bg-zinc-50 p-2">
                <p className="text-[11px] text-zinc-500">{k}</p>
                <p className="text-lg font-bold text-zinc-900">{v}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Gráfica */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">
              {medida === 'usd' ? 'Ingresos' : 'Balitas vendidas'} {periodo === 'diaria' ? 'por día (31 días)' : periodo === 'semanal' ? 'por semana (12 semanas)' : 'por mes (12 meses)'}
            </CardTitle>
            <div className="flex flex-wrap gap-1">
              {(['diaria', 'semanal', 'mensual'] as Periodo[]).map((x) => (
                <Button key={x} size="sm" variant={periodo === x ? 'default' : 'outline'} onClick={() => setPeriodo(x)}>
                  {x === 'diaria' ? 'Diario' : x === 'semanal' ? 'Semanal' : 'Mensual'}
                </Button>
              ))}
              <Button size="sm" variant="outline" onClick={() => setMedida(medida === 'usd' ? 'balitas' : 'usd')}>
                Ver {medida === 'usd' ? 'balitas' : 'dólares'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="periodo" tickFormatter={etiquetaX} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} minTickGap={12} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={48} allowDecimals={medida === 'usd'} />
                <Tooltip
                  cursor={{ fill: 'rgba(18,61,131,0.06)' }}
                  labelFormatter={(d) => (periodo === 'semanal' ? `Semana del ${fecha(String(d))}` : periodo === 'mensual' ? mesTxt(String(d)) : fecha(String(d)))}
                  formatter={(_v, _n, item) => {
                    const f = item.payload as FilaSerie;
                    return [`${usd(f.usd)} · ${f.balitas} balitas · ${f.compras} compras`, ''];
                  }}
                  separator=""
                />
                <Bar dataKey={medida} fill={AZUL} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Por punto */}
      <div className="grid gap-4 lg:grid-cols-2">
        {datos.puntos.map((p) => <TarjetaPunto key={p.id} p={p} />)}
      </div>

      {/* Compradores */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Compradores ({compradores.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
              <Input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Nombre, teléfono o correo" className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-50 text-left text-xs text-zinc-500">
                <tr>
                  <th className="p-2 font-medium">Comprador</th>
                  <th className="p-2 font-medium text-right">Compras</th>
                  <th className="p-2 font-medium text-right">Balitas</th>
                  <th className="p-2 font-medium text-right">Total</th>
                  <th className="p-2 font-medium hidden sm:table-cell">Primera</th>
                  <th className="p-2 font-medium">Última</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {compradores.map((c) => (
                  <tr key={c.telefono + c.nombre} className="border-t">
                    <td className="p-2">
                      <p className="font-medium text-zinc-900">{c.nombre}</p>
                      <p className="text-xs text-zinc-500">{c.telefono}{c.email ? ` · ${c.email}` : ''}</p>
                    </td>
                    <td className="p-2 text-right">{c.compras}</td>
                    <td className="p-2 text-right">{c.balitas}</td>
                    <td className="p-2 text-right font-semibold">{usd(c.usd)}</td>
                    <td className="p-2 text-xs hidden sm:table-cell">{fecha(c.primera)}</td>
                    <td className="p-2 text-xs">{fecha(c.ultima)}</td>
                  </tr>
                ))}
                {!compradores.length && (
                  <tr><td colSpan={6} className="p-6 text-center text-zinc-400">Sin compradores todavía.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
