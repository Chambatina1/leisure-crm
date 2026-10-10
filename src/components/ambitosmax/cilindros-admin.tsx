'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Loader2, RefreshCw, Printer, Send, CheckCircle2, XCircle, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

interface Reserva {
  id: number;
  numero: string;
  nombreComprador: string;
  telefonoComprador: string;
  emailComprador: string | null;
  nombreRecoge: string;
  carnetRecoge: string;
  telefonoRecoge: string | null;
  cantidad: number;
  montoUsd: number;
  estado: 'pendiente_pago' | 'pagada' | 'entregada' | 'anulada';
  pin: string | null;
  lote: string;
  punto?: string;
  notas: string | null;
  createdAt: string;
}

interface Datos {
  lote: string;
  loteAbierto: string;
  cerradoHoy: boolean;
  hoyCuba: string;
  reservas: Reserva[];
  pendientesTodas: Reserva[];
  lotes: { lote: string; n: number }[];
  resumen: { total: number; pendientes: number; confirmadas: number; entregadas: number; cilindros: number; usd: number };
}

const ESTADO: Record<Reserva['estado'], { txt: string; cls: string }> = {
  pendiente_pago: { txt: 'Pendiente de pago', cls: 'bg-amber-100 text-amber-800' },
  pagada: { txt: 'Pagada', cls: 'bg-emerald-100 text-emerald-800' },
  entregada: { txt: 'Entregada', cls: 'bg-blue-100 text-blue-800' },
  anulada: { txt: 'Anulada', cls: 'bg-zinc-100 text-zinc-500' },
};

const nombrePunto = (p?: string) => (p === 'bar-madera' ? 'Bar Madera' : 'Los Avioncitos');

const fecha = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export function CilindrosAdmin() {
  const [lote, setLote] = useState<string>('');
  const [datos, setDatos] = useState<Datos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [carnet, setCarnet] = useState('');
  const [pin, setPin] = useState('');
  const [entregando, setEntregando] = useState(false);
  const [resultadoEntrega, setResultadoEntrega] = useState<{ ok: boolean; texto: string } | null>(null);
  const [enviandoInforme, setEnviandoInforme] = useState(false);

  const cargar = useCallback(async (l?: string) => {
    setCargando(true);
    try {
      const q = l ? `?lote=${l}` : '';
      const r = await fetch(`/api/cilindros${q}`);
      const j = await r.json();
      if (j.ok) {
        setDatos(j.data);
        setLote(j.data.lote);
      } else toast.error(j.error || 'Error al cargar');
    } catch {
      toast.error('Error de conexión');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const confirmar = async (r: Reserva) => {
    const referencia = window.prompt(
      `Confirmar pago de $${r.montoUsd.toFixed(2)} de ${r.nombreComprador} (${r.numero}).\n\n` +
        'Revisa en tu banco que llegó el Zelle con la referencia ' + r.numero + '.\n' +
        'Escribe el número de confirmación de Zelle (opcional) y pulsa Aceptar:',
      ''
    );
    if (referencia === null) return; // canceló
    setOcupado(r.id);
    try {
      const res = await fetch(`/api/cilindros/${r.id}/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenciaZelle: referencia }),
      });
      const j = await res.json();
      if (j.ok) {
        const extra =
          j.correo === 'enviado' ? ' Enviado por correo.' : j.correo === 'fallo' ? ' No se pudo enviar el correo: mándalo por WhatsApp.' : ' Sin correo: mándalo por WhatsApp.';
        toast.success(`PIN ${j.data.pin} generado.${extra}`, { duration: 10000 });
        if (j.movidaAlLote) toast.info(`El cierre de su día ya pasó: va al listado del ${fecha(j.movidaAlLote)}.`);
        cargar(lote);
      } else toast.error(j.error || 'No se pudo confirmar');
    } finally {
      setOcupado(null);
    }
  };

  const anular = async (r: Reserva) => {
    if (!confirm(`¿Anular la reserva ${r.numero}?`)) return;
    setOcupado(r.id);
    try {
      const res = await fetch(`/api/cilindros/${r.id}/anular`, { method: 'POST' });
      const j = await res.json();
      if (j.ok) { toast.success('Reserva anulada'); cargar(lote); }
      else toast.error(j.error);
    } finally {
      setOcupado(null);
    }
  };

  const entregar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntregando(true);
    setResultadoEntrega(null);
    try {
      const res = await fetch('/api/cilindros/entregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carnet, pin }),
      });
      const j = await res.json();
      if (j.ok) {
        setResultadoEntrega({ ok: true, texto: `ENTREGAR ${j.data.cantidad} cilindro(s) a ${j.data.nombreRecoge} — ${j.data.numero}` });
        setCarnet(''); setPin('');
        cargar(lote);
      } else setResultadoEntrega({ ok: false, texto: j.error });
    } finally {
      setEntregando(false);
    }
  };

  const enviarInforme = async () => {
    if (!confirm(`¿Enviar ahora por correo el listado del ${fecha(lote)}?`)) return;
    setEnviandoInforme(true);
    try {
      const res = await fetch('/api/cilindros/cierre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lote, reenviar: true }),
      });
      const j = await res.json();
      if (j.ok && !j.omitido) toast.success(`Informe enviado a ${j.enviadoA.join(', ')}`);
      else toast.error(j.error || j.omitido);
    } finally {
      setEnviandoInforme(false);
    }
  };

  const r = datos?.resumen;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Flame className="h-7 w-7 text-amber-600" />Cilindros de gas</h2>
          <p className="text-sm text-muted-foreground">
            Cierre diario 8:00 PM (hora de Cuba) · el listado sale solo por correo.
            {datos && (datos.cerradoHoy ? ' Hoy ya cerró: las reservas nuevas van al listado de mañana.' : ' Ventas de hoy abiertas.')}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={lote}
            onChange={(e) => cargar(e.target.value)}
            className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm"
          >
            {datos &&
              Array.from(new Set([datos.loteAbierto, lote, ...datos.lotes.map((l) => l.lote)]))
                .filter(Boolean)
                .sort()
                .reverse()
                .map((l) => {
                  const n = datos.lotes.find((x) => x.lote === l)?.n ?? 0;
                  return (
                    <option key={l} value={l}>
                      {fecha(l)}{l === datos.loteAbierto ? ' (abierto)' : ''} · {n}
                    </option>
                  );
                })}
          </select>
          <Button variant="outline" size="sm" onClick={() => cargar(lote)}><RefreshCw className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/cilindros/informe?lote=${lote}`, '_blank')}>
            <Printer className="h-4 w-4 mr-1" />Imprimir listado
          </Button>
          <Button size="sm" disabled={enviandoInforme} onClick={enviarInforme} className="bg-[#123d83] hover:bg-[#071a46] text-white">
            {enviandoInforme ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" />Enviar informe</>}
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <form onSubmit={entregar} className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex-1">
              <p className="text-xs font-bold text-zinc-500 mb-1 flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" />Entregar: carnet de quien recoge</p>
              <Input value={carnet} onChange={(e) => setCarnet(e.target.value.replace(/\D/g, '').slice(0, 11))} inputMode="numeric" placeholder="11 dígitos" className="font-mono" />
            </div>
            <div className="sm:w-40">
              <p className="text-xs font-bold text-zinc-500 mb-1">PIN</p>
              <Input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="000000" className="font-mono tracking-widest" />
            </div>
            <Button type="submit" disabled={entregando || carnet.length !== 11 || pin.length !== 6} className="bg-[#55b949] hover:bg-[#3f9a35] text-white font-bold">
              {entregando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Comprobar y entregar'}
            </Button>
          </form>
          {resultadoEntrega && (
            <div className={`mt-3 rounded-lg p-3 text-sm font-bold flex items-center gap-2 ${resultadoEntrega.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
              {resultadoEntrega.ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {resultadoEntrega.texto}
            </div>
          )}
        </CardContent>
      </Card>

      {datos && datos.pendientesTodas.length > 0 && (
        <Card className="border-0 shadow-md border-l-4 border-l-amber-400">
          <CardContent className="p-4">
            <p className="font-bold text-amber-900 mb-1">Pagos por confirmar ({datos.pendientesTodas.length})</p>
            <p className="text-xs text-zinc-500 mb-3">Cuando veas el Zelle en el banco, pulsa “Confirmar pago”: se genera el PIN y el cliente pasa al listado de recogida.</p>
            <div className="space-y-2">
              {datos.pendientesTodas.map((x) => (
                <div key={x.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50 rounded-lg p-3 text-sm">
                  <div>
                    <span className="font-mono font-bold">{x.numero}</span> · <b>${x.montoUsd.toFixed(2)}</b> · {x.cantidad} cil.
                    <span className="text-zinc-500"> · paga {x.nombreComprador} ({x.telefonoComprador}) · recoge {x.nombreRecoge} en {nombrePunto(x.punto)}</span>
                    <span className="text-zinc-400"> · reservó {new Date(x.createdAt).toLocaleString('es-ES', { timeZone: 'America/Havana', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" disabled={ocupado === x.id} onClick={() => confirmar(x)} className="bg-[#55b949] hover:bg-[#3f9a35] text-white text-xs h-8">
                      {ocupado === x.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirmar pago'}
                    </Button>
                    <Button size="sm" variant="ghost" disabled={ocupado === x.id} onClick={() => anular(x)} className="text-xs h-8 text-red-600">Anular</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {r && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Reservas', v: r.total },
            { label: 'Pendientes de pago', v: r.pendientes },
            { label: 'Confirmadas', v: r.confirmadas },
            { label: 'Cilindros a entregar', v: r.cilindros },
            { label: 'Cobrado (USD)', v: `$${r.usd.toFixed(2)}` },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-sm"><CardContent className="p-3"><p className="text-xl font-bold">{s.v}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>
      )}

      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          {cargando ? (
            <div className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-400" /></div>
          ) : !datos || datos.reservas.length === 0 ? (
            <p className="p-10 text-center text-sm text-zinc-400">No hay reservas en el listado del {fecha(lote)}.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
                  <tr>
                    <th className="p-3">Reserva</th><th className="p-3">Punto</th><th className="p-3">Recoge</th><th className="p-3">Carnet</th>
                    <th className="p-3">Cant.</th><th className="p-3">Paga</th><th className="p-3">Estado</th><th className="p-3">PIN</th><th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {datos.reservas.map((x) => (
                    <tr key={x.id} className="border-t border-zinc-100 align-top">
                      <td className="p-3 font-mono text-xs">{x.numero}<br /><span className="text-zinc-400">${x.montoUsd.toFixed(2)}</span></td>
                      <td className="p-3 text-xs font-bold whitespace-nowrap">{nombrePunto(x.punto)}</td>
                      <td className="p-3 font-semibold">{x.nombreRecoge}<br /><span className="text-xs text-zinc-400 font-normal">{x.telefonoRecoge}</span></td>
                      <td className="p-3 font-mono text-xs">{x.carnetRecoge}</td>
                      <td className="p-3 text-center">{x.cantidad}</td>
                      <td className="p-3 text-xs">{x.nombreComprador}<br /><span className="text-zinc-400">{x.telefonoComprador}</span></td>
                      <td className="p-3"><span className={`text-[11px] font-bold px-2 py-1 rounded-full ${ESTADO[x.estado].cls}`}>{ESTADO[x.estado].txt}</span></td>
                      <td className="p-3 font-mono font-bold">{x.pin || '—'}{x.notas && <div className="text-[10px] font-normal text-zinc-400 font-sans">{x.notas}</div>}</td>
                      <td className="p-3 whitespace-nowrap">
                        {x.estado === 'pendiente_pago' && (
                          <Button size="sm" disabled={ocupado === x.id} onClick={() => confirmar(x)} className="bg-[#55b949] hover:bg-[#3f9a35] text-white text-xs h-8">
                            {ocupado === x.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirmar pago'}
                          </Button>
                        )}
                        {(x.estado === 'pendiente_pago' || x.estado === 'pagada') && (
                          <Button size="sm" variant="ghost" disabled={ocupado === x.id} onClick={() => anular(x)} className="text-xs h-8 text-red-600">Anular</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
