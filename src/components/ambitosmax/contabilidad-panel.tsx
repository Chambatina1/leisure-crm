'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, Loader2, RefreshCw, Plus, Mail, Link2, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface Linea { nombre: string; monto: number }
interface PyG {
  desde: string;
  hasta: string;
  ingresos: number;
  costoVentas: number;
  gastos: number;
  utilidad: number;
  detalleIngresos: Linea[];
  detalleGastos: Linea[];
}
interface Gasto { id: string; fecha: string; monto: number; cuenta: string; nota: string }
interface Cuenta { Id: string; Name: string }
interface EstadoQbo {
  appConfigurada: boolean;
  conectado: boolean;
  webhookConfigurado: boolean;
  redirectUri: string;
  webhookUrl: string;
}

type Periodo = 'semana' | 'mes' | 'anio';
const NOMBRE_PERIODO: Record<Periodo, string> = { semana: 'Esta semana', mes: 'Este mes', anio: 'Este año' };

const usd = (n: number) =>
  (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fecha = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

export function ContabilidadPanel() {
  const [estado, setEstado] = useState<EstadoQbo | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [pyg, setPyg] = useState<PyG | null>(null);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [cuentas, setCuentas] = useState<{ gasto: Cuenta[]; pago: Cuenta[] }>({ gasto: [], pago: [] });
  const [form, setForm] = useState({ fecha: hoy(), monto: '', cuentaGastoId: '', cuentaPagoId: '', descripcion: '' });
  const [guardando, setGuardando] = useState(false);

  const [emails, setEmails] = useState('');
  const [guardandoEmail, setGuardandoEmail] = useState(false);
  const [probando, setProbando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  const cargar = useCallback(async (p: Periodo) => {
    setCargando(true);
    setError('');
    try {
      const est = await fetch('/api/quickbooks/estado').then((r) => r.json());
      if (est.ok) setEstado(est.data);
      if (!est.data?.conectado) return;
      const r = await fetch(`/api/contabilidad?periodo=${p}`).then((x) => x.json());
      if (!r.ok) throw new Error(r.error || 'No se pudo leer QuickBooks');
      setPyg(r.data.pyg);
      setGastos(r.data.gastos);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => cargar(periodo), 0);
    return () => clearTimeout(t);
  }, [cargar, periodo]);

  useEffect(() => {
    if (!estado?.conectado) return;
    fetch('/api/contabilidad/cuentas')
      .then((r) => r.json())
      .then((r) => {
        if (!r.ok) return;
        setCuentas(r.data);
        setForm((f) => ({ ...f, cuentaPagoId: f.cuentaPagoId || r.data.pago[0]?.Id || '' }));
      });
    fetch('/api/contabilidad/ajustes')
      .then((r) => r.json())
      .then((r) => r.ok && setEmails(r.data.emails));
  }, [estado?.conectado]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('qbo');
    if (!q) return;
    const msg: Record<string, string> = {
      conectado: 'QuickBooks conectado',
      cancelado: 'Se canceló la conexión con QuickBooks',
      caducado: 'El enlace caducó; vuelve a pulsar Conectar',
      error: 'No se pudo conectar QuickBooks',
    };
    if (q === 'conectado') toast.success(msg[q]);
    else toast.error(msg[q] || 'QuickBooks');
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const r = await fetch('/api/contabilidad/gasto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, monto: parseFloat(form.monto) }),
      }).then((x) => x.json());
      if (!r.ok) throw new Error(r.error);
      toast.success('Gasto registrado en QuickBooks');
      setForm((f) => ({ ...f, monto: '', descripcion: '' }));
      cargar(periodo);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo registrar');
    } finally {
      setGuardando(false);
    }
  };

  const guardarEmails = async () => {
    setGuardandoEmail(true);
    try {
      const r = await fetch('/api/contabilidad/ajustes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      }).then((x) => x.json());
      if (!r.ok) throw new Error(r.error);
      setEmails(r.data.emails);
      toast.success('Correo del informe guardado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setGuardandoEmail(false);
    }
  };

  const enviarPrueba = async () => {
    setProbando(true);
    try {
      const r = await fetch('/api/contabilidad/informe-semanal', { method: 'POST' }).then((x) => x.json());
      if (!r.ok) throw new Error(r.error);
      toast.success(`Informe enviado a ${r.data.enviadoA.join(', ')}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo enviar');
    } finally {
      setProbando(false);
    }
  };

  const sincronizar = async () => {
    setSincronizando(true);
    try {
      const r = await fetch('/api/quickbooks/sincronizar', { method: 'POST' }).then((x) => x.json());
      if (!r.ok) throw new Error(r.error);
      const { revisadas, confirmadas, errores } = r.data;
      if (confirmadas.length) toast.success(`Pagos confirmados: ${confirmadas.join(', ')}`);
      else toast.message(`Revisadas ${revisadas} facturas; ninguna pagada todavía`);
      if (errores.length) toast.error(errores.slice(0, 3).join(' · '));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo revisar');
    } finally {
      setSincronizando(false);
    }
  };

  // ─── Sin conexión: qué falta ─────────────────────────────────
  if (!cargando && estado && !estado.conectado) {
    return (
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-2xl font-black text-[#071a46] flex items-center gap-2"><Calculator className="h-6 w-6" />Contabilidad</h1>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 space-y-3">
            <p className="font-bold text-[#071a46]">Conecta QuickBooks para ver ingresos, gastos y utilidad</p>
            {!estado.appConfigurada ? (
              <p className="text-sm text-zinc-600 flex gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                Faltan las credenciales de la app de QuickBooks (QBO_CLIENT_ID y QBO_CLIENT_SECRET) en el servidor.
              </p>
            ) : (
              <Button onClick={() => (window.location.href = '/api/quickbooks/conectar')} className="bg-[#2ca01c] hover:bg-[#238016] text-white font-bold">
                <Link2 className="h-4 w-4 mr-2" />Conectar QuickBooks
              </Button>
            )}
            <p className="text-xs text-zinc-500">
              Mientras QuickBooks no esté conectado, el gas y el combustible se siguen cobrando por Zelle con confirmación manual.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gastoTotal = pyg ? pyg.gastos + pyg.costoVentas : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black text-[#071a46] flex items-center gap-2"><Calculator className="h-6 w-6" />Contabilidad</h1>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(NOMBRE_PERIODO) as Periodo[]).map((p) => (
            <Button key={p} size="sm" variant={p === periodo ? 'default' : 'outline'} onClick={() => setPeriodo(p)}
              className={p === periodo ? 'bg-[#123d83] hover:bg-[#071a46] text-white' : ''}>
              {NOMBRE_PERIODO[p]}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={() => cargar(periodo)}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {estado?.conectado && (
        <p className="text-xs text-[#2ca01c] font-semibold flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />QuickBooks conectado{pyg ? ` · ${fecha(pyg.desde)} – ${fecha(pyg.hasta)}` : ''}
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {cargando || !pyg ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#123d83]" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="border-0 shadow-md"><CardContent className="p-4">
              <p className="text-xs font-bold text-zinc-500 uppercase">Ingresos</p>
              <p className="text-2xl font-black text-[#071a46]">{usd(pyg.ingresos)}</p>
            </CardContent></Card>
            <Card className="border-0 shadow-md"><CardContent className="p-4">
              <p className="text-xs font-bold text-zinc-500 uppercase">Gastos</p>
              <p className="text-2xl font-black text-[#071a46]">{usd(gastoTotal)}</p>
            </CardContent></Card>
            <Card className={`border-0 shadow-md ${pyg.utilidad >= 0 ? 'bg-green-50' : 'bg-red-50'}`}><CardContent className="p-4">
              <p className="text-xs font-bold text-zinc-500 uppercase">Utilidad</p>
              <p className={`text-2xl font-black flex items-center gap-1 ${pyg.utilidad >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {pyg.utilidad >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}{usd(pyg.utilidad)}
              </p>
              <p className="text-xs text-zinc-500">
                Margen {pyg.ingresos > 0 ? `${((pyg.utilidad / pyg.ingresos) * 100).toFixed(1)}%` : '—'}
              </p>
            </CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="border-0 shadow-md"><CardContent className="p-4">
              <p className="font-bold text-[#071a46] mb-2">Ingresos por cuenta</p>
              {pyg.detalleIngresos.length ? pyg.detalleIngresos.map((l) => (
                <div key={l.nombre} className="flex justify-between text-sm py-1 border-b border-zinc-100 last:border-0">
                  <span>{l.nombre}</span><b>{usd(l.monto)}</b>
                </div>
              )) : <p className="text-sm text-zinc-500">Sin ingresos en este periodo</p>}
            </CardContent></Card>
            <Card className="border-0 shadow-md"><CardContent className="p-4">
              <p className="font-bold text-[#071a46] mb-2">Gastos por categoría</p>
              {pyg.detalleGastos.length ? pyg.detalleGastos.map((l) => (
                <div key={l.nombre} className="flex justify-between text-sm py-1 border-b border-zinc-100 last:border-0">
                  <span>{l.nombre}</span><b>{usd(l.monto)}</b>
                </div>
              )) : <p className="text-sm text-zinc-500">Sin gastos en este periodo</p>}
            </CardContent></Card>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="border-0 shadow-md"><CardContent className="p-4">
          <p className="font-bold text-[#071a46] mb-3 flex items-center gap-1"><Plus className="h-4 w-4" />Registrar gasto</p>
          <form onSubmit={registrar} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              <Input type="number" step="0.01" min="0" inputMode="decimal" placeholder="Monto $" value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })} />
            </div>
            <select value={form.cuentaGastoId} onChange={(e) => setForm({ ...form, cuentaGastoId: e.target.value })}
              className="w-full h-9 rounded-md border border-zinc-200 px-2 text-sm bg-white">
              <option value="">Categoría del gasto…</option>
              {cuentas.gasto.map((c) => <option key={c.Id} value={c.Id}>{c.Name}</option>)}
            </select>
            <select value={form.cuentaPagoId} onChange={(e) => setForm({ ...form, cuentaPagoId: e.target.value })}
              className="w-full h-9 rounded-md border border-zinc-200 px-2 text-sm bg-white">
              <option value="">Pagado desde…</option>
              {cuentas.pago.map((c) => <option key={c.Id} value={c.Id}>{c.Name}</option>)}
            </select>
            <Input placeholder="Descripción (ej. compra de 20 balitas)" value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            <Button type="submit" disabled={guardando || !form.monto || !form.cuentaGastoId || !form.cuentaPagoId || form.descripcion.trim().length < 3}
              className="w-full bg-[#123d83] hover:bg-[#071a46] text-white font-bold">
              {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar en QuickBooks'}
            </Button>
          </form>
        </CardContent></Card>

        <Card className="border-0 shadow-md"><CardContent className="p-4 space-y-3">
          <p className="font-bold text-[#071a46] flex items-center gap-1"><Mail className="h-4 w-4" />Informe de los viernes</p>
          <p className="text-xs text-zinc-500">Cada viernes se envía la utilidad de la semana, del mes y del año a estos correos.</p>
          <div className="flex gap-2">
            <Input value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="correo@ejemplo.com" />
            <Button variant="outline" disabled={guardandoEmail} onClick={guardarEmails}>
              {guardandoEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={probando || !emails} onClick={enviarPrueba}>
              {probando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar el informe ahora'}
            </Button>
            <Button size="sm" variant="outline" disabled={sincronizando} onClick={sincronizar}>
              {sincronizando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Revisar pagos en QuickBooks'}
            </Button>
          </div>
          {estado && !estado.webhookConfigurado && (
            <p className="text-xs text-amber-700 flex gap-1">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Falta el aviso automático de pagos (webhook). Hasta configurarlo, los pagos se confirman al revisar o cuando el cliente consulta su reserva.
            </p>
          )}
        </CardContent></Card>
      </div>

      {gastos.length > 0 && (
        <Card className="border-0 shadow-md"><CardContent className="p-4">
          <p className="font-bold text-[#071a46] mb-2">Gastos del periodo</p>
          {gastos.map((g) => (
            <div key={g.id} className="flex justify-between gap-2 text-sm py-1.5 border-b border-zinc-100 last:border-0">
              <span className="text-zinc-500 w-24 shrink-0">{fecha(g.fecha)}</span>
              <span className="flex-1 truncate">{g.nota || g.cuenta}<span className="text-zinc-400"> · {g.cuenta}</span></span>
              <b>{usd(g.monto)}</b>
            </div>
          ))}
        </CardContent></Card>
      )}
    </div>
  );
}
