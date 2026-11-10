'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KeyRound, Loader2, Search } from 'lucide-react';

interface Fila {
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
  estado: 'pagada' | 'entregada';
  pin: string | null;
  lote: string;
  puntoRecogida: string | null;
  pagadaEn: string | null;
  createdAt: string;
}

const cuando = (f: Fila) =>
  new Date(f.pagadaEn || f.createdAt).toLocaleString('es-ES', {
    timeZone: 'America/Havana', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

/** Todas las compras de balitas pagadas, de cualquier día, con su PIN y su cliente. */
export function RegistroPines() {
  const [buscar, setBuscar] = useState('');
  const [filas, setFilas] = useState<Fila[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async (texto: string) => {
    setCargando(true);
    try {
      const r = await fetch(`/api/cilindros/registro${texto ? `?buscar=${encodeURIComponent(texto)}` : ''}`);
      const j = await r.json();
      setFilas(j.ok ? j.data : []);
    } catch {
      setFilas([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/cilindros/registro')
      .then((r) => r.json())
      .then((j) => setFilas(j.ok ? j.data : []))
      .catch(() => setFilas([]))
      .finally(() => setCargando(false));
  }, []);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-5 w-5 text-[#123d83]" />Registro de compras pagadas y sus PIN</CardTitle>
        <CardDescription>Todas las balitas pagadas de todos los días, con el número RC-, el PIN, quién pagó y quién recoge.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form
          onSubmit={(e) => { e.preventDefault(); cargar(buscar.trim()); }}
          className="flex gap-2"
        >
          <Input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por RC, nombre, teléfono, carnet o PIN" />
          <Button type="submit" className="bg-[#123d83] hover:bg-[#071a46] text-white shrink-0"><Search className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Buscar</span></Button>
        </form>
        {cargando ? (
          <div className="p-6 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-400" /></div>
        ) : filas.length === 0 ? (
          <p className="p-6 text-center text-sm text-zinc-400">No hay compras pagadas{buscar ? ' que coincidan' : ''}.</p>
        ) : (
          <>
            <p className="text-xs text-zinc-500">{filas.length} compra(s){filas.length === 300 ? ' (las 300 más recientes; usa el buscador)' : ''}</p>
            <div className="overflow-x-auto rounded-lg border border-zinc-100">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
                  <tr>
                    <th className="p-2.5">RC</th><th className="p-2.5">PIN</th><th className="p-2.5">Cliente (paga)</th>
                    <th className="p-2.5">Recoge</th><th className="p-2.5">Punto</th><th className="p-2.5">Cant.</th><th className="p-2.5">Pagada</th><th className="p-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.id} className="border-t border-zinc-100 align-top">
                      <td className="p-2.5 font-mono text-xs font-bold whitespace-nowrap">{f.numero}<br /><span className="font-normal text-zinc-400">${Number(f.montoUsd).toFixed(2)}</span></td>
                      <td className="p-2.5 font-mono text-base font-black tracking-wider text-[#071a46]">{f.pin || '—'}</td>
                      <td className="p-2.5 text-xs">
                        <b className="text-sm text-zinc-900">{f.nombreComprador}</b><br />
                        <span className="text-zinc-500">{f.telefonoComprador}</span>
                        {f.emailComprador && <><br /><span className="text-zinc-400 break-all">{f.emailComprador}</span></>}
                      </td>
                      <td className="p-2.5 text-xs">
                        <b className="text-zinc-900">{f.nombreRecoge}</b><br />
                        <span className="font-mono text-zinc-500">{f.carnetRecoge}</span>
                        {f.telefonoRecoge && <><br /><span className="text-zinc-400">{f.telefonoRecoge}</span></>}
                      </td>
                      <td className="p-2.5 text-xs text-[#123d83]">{f.puntoRecogida || '—'}</td>
                      <td className="p-2.5 text-center">{f.cantidad}</td>
                      <td className="p-2.5 text-xs whitespace-nowrap text-zinc-500">{cuando(f)}</td>
                      <td className="p-2.5">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${f.estado === 'entregada' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {f.estado === 'entregada' ? 'Entregada' : 'Pagada'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
