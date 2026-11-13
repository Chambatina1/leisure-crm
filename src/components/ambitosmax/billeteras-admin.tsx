'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Search, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface Fila { id: number; codigo: string; nombre: string; email: string; telefono: string | null; saldo: number; ultimo: string | null }
interface Mov { id: number; tipo: string; monto: number; referencia: string | null; detalle: string | null; creadoPor: string; createdAt: string }

const TIPOS = {
  recarga: { txt: 'Recarga a mano', ayuda: 'Llegó un Zelle sin el código BM- (o pasó del tope). Suma el importe.' },
  devolucion: { txt: 'Devolución', ayuda: 'Ya le devolviste el dinero por Zelle. Resta el importe del saldo.' },
  ajuste: { txt: 'Ajuste', ayuda: 'Corrección: positivo suma, negativo resta.' },
} as const;
type Tipo = keyof typeof TIPOS;

const fecha = (f: string | null) => (f ? new Date(f).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');

export function BilleterasAdmin() {
  const [q, setQ] = useState('');
  const [filas, setFilas] = useState<Fila[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [abierta, setAbierta] = useState<Fila | null>(null);

  const [busqueda, setBusqueda] = useState({ texto: '', vuelta: 0 });
  useEffect(() => {
    let vigente = true;
    fetch(`/api/billetera/admin?q=${encodeURIComponent(busqueda.texto)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (!vigente) return;
        if (j.ok) { setFilas(j.data); setTotal(j.totalSaldos); } else toast.error(j.error || 'No se pudo cargar');
      })
      .catch(() => vigente && toast.error('Error de conexión'))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [busqueda]);
  const cargar = useCallback((texto: string) => { setCargando(true); setBusqueda((b) => ({ texto, vuelta: b.vuelta + 1 })); }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#071a46] flex items-center gap-2"><Wallet className="h-6 w-6" /> Billeteras de clientes</h1>
          <p className="text-sm text-zinc-500">Saldo guardado de todos los clientes: <b className="text-zinc-900">${total.toFixed(2)}</b> (es dinero de los clientes, todavía no es venta).</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); cargar(q); }} className="flex gap-2 w-full sm:w-auto">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="BM-, nombre, correo o teléfono" className="sm:w-72" />
          <Button type="submit" variant="outline" disabled={cargando}>{cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
        </form>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-left">
              <tr><th className="p-3">Código</th><th className="p-3">Cliente</th><th className="p-3 text-right">Saldo</th><th className="p-3">Último movimiento</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {filas.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-zinc-500">{cargando ? 'Cargando…' : 'No hay billeteras'}</td></tr>}
              {filas.map((f) => (
                <tr key={f.id} className="border-t border-zinc-100">
                  <td className="p-3 font-mono font-bold">{f.codigo}</td>
                  <td className="p-3"><b>{f.nombre}</b><br /><span className="text-zinc-500">{f.email}{f.telefono ? ` · ${f.telefono}` : ''}</span></td>
                  <td className="p-3 text-right font-bold">${f.saldo.toFixed(2)}</td>
                  <td className="p-3 text-zinc-500 whitespace-nowrap">{fecha(f.ultimo)}</td>
                  <td className="p-3 text-right"><Button size="sm" variant="outline" onClick={() => setAbierta(f)}>Abrir</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {abierta && <DetalleBilletera fila={abierta} onCerrar={() => setAbierta(null)} onCambio={() => cargar(q)} />}
    </div>
  );
}

function DetalleBilletera({ fila, onCerrar, onCambio }: { fila: Fila; onCerrar: () => void; onCambio: () => void }) {
  const [movs, setMovs] = useState<Mov[]>([]);
  const [saldo, setSaldo] = useState(fila.saldo);
  const [tipo, setTipo] = useState<Tipo>('recarga');
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    let vigente = true;
    fetch(`/api/billetera/admin?id=${fila.id}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => { if (vigente && j?.ok) setMovs(j.data); })
      .catch(() => {});
    return () => { vigente = false; };
  }, [fila.id, vuelta]);
  const cargar = () => setVuelta((v) => v + 1);

  const anotar = async () => {
    const n = Number(monto.replace(',', '.'));
    if (!Number.isFinite(n) || n === 0) return toast.error('Escribe un importe');
    if (!confirm(`${TIPOS[tipo].txt} de $${Math.abs(n).toFixed(2)} en ${fila.codigo} (${fila.nombre}). ¿Confirmas?`)) return;
    setGuardando(true);
    try {
      const j = await fetch('/api/billetera/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billeteraId: fila.id, tipo, monto: n, nota }),
      }).then((r) => r.json());
      if (!j.ok) return toast.error(j.error || 'No se pudo anotar');
      toast.success(`Anotado. Saldo ahora $${j.saldo.toFixed(2)}. Se avisó al cliente por correo.`);
      setSaldo(j.saldo); setMonto(''); setNota('');
      cargar(); onCambio();
    } catch { toast.error('Error de conexión'); } finally { setGuardando(false); }
  };

  return (
    <Card className="border-[#123d83]">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-lg font-black">{fila.codigo}</p>
            <p className="text-sm text-zinc-600">{fila.nombre} · {fila.email}</p>
            <p className="text-2xl font-black text-[#071a46] mt-1">Saldo ${saldo.toFixed(2)}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCerrar} aria-label="Cerrar"><X className="h-5 w-5" /></Button>
        </div>

        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TIPOS) as Tipo[]).map((t) => (
              <Button key={t} size="sm" variant={tipo === t ? 'default' : 'outline'} onClick={() => setTipo(t)} className={tipo === t ? 'bg-[#123d83] text-white' : ''}>{TIPOS[t].txt}</Button>
            ))}
          </div>
          <p className="text-xs text-zinc-500">{TIPOS[tipo].ayuda}</p>
          <div className="grid sm:grid-cols-[140px_1fr] gap-3">
            <div><Label htmlFor="bm-monto">Importe $</Label><Input id="bm-monto" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="68.25" /></div>
            <div><Label htmlFor="bm-nota">Nota (obligatoria)</Label><Input id="bm-nota" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Zelle de Juan Pérez del 13/11 sin código" /></div>
          </div>
          <Button onClick={anotar} disabled={guardando || nota.trim().length < 3} className="bg-[#123d83] text-white">
            {guardando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Anotar
          </Button>
        </div>

        <div>
          <h3 className="font-bold text-[#071a46] mb-2">Movimientos</h3>
          {movs.length === 0 ? <p className="text-sm text-zinc-500">Sin movimientos.</p> : (
            <ul className="divide-y divide-zinc-100 text-sm">
              {movs.map((m) => (
                <li key={m.id} className="py-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{m.tipo}{m.referencia && m.tipo !== 'recarga' ? ` · ${m.referencia}` : ''} <span className="text-xs font-normal text-zinc-400">({m.creadoPor})</span></p>
                    {m.detalle && <p className="text-xs text-zinc-500 [overflow-wrap:anywhere]">{m.detalle}</p>}
                    <p className="text-xs text-zinc-400">{fecha(m.createdAt)}</p>
                  </div>
                  <span className={`font-bold whitespace-nowrap ${m.monto > 0 ? 'text-emerald-700' : 'text-zinc-800'}`}>{m.monto > 0 ? '+' : '−'}${Math.abs(m.monto).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
