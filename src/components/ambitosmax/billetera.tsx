'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from './store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Copy, RefreshCw, ArrowDownLeft, ArrowUpRight, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

export interface DatosBilletera {
  codigo: string;
  saldo: number;
  tope: number;
  zelle: string;
  movimientos: { id: number; tipo: 'recarga' | 'compra' | 'devolucion' | 'ajuste'; monto: number; referencia: string | null; detalle: string | null; fecha: string }[];
}

/** Carga la billetera del cliente con sesión (null si no hay sesión). */
export function useBilletera(activa = true) {
  const currentUser = useAppStore((s) => s.currentUser);
  const [datos, setDatos] = useState<DatosBilletera | null>(null);
  const [cargando, setCargando] = useState(false);
  const [vuelta, setVuelta] = useState(0);
  const conSesion = !!currentUser && activa;
  useEffect(() => {
    if (!conSesion) return;
    let vigente = true;
    fetch('/api/billetera', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => vigente && setDatos(j.ok ? j.data : null))
      .catch(() => vigente && setDatos(null))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [conSesion, vuelta]);
  const recargar = useCallback(() => { setCargando(true); setVuelta((v) => v + 1); }, []);
  return { datos: conSesion ? datos : null, cargando, recargar };
}

const copiar = (t: string, aviso: string) =>
  navigator.clipboard?.writeText(t).then(() => toast.success(aviso), () => toast.error('No se pudo copiar'));

const NOMBRE_TIPO = { recarga: 'Recarga por Zelle', compra: 'Compra', devolucion: 'Devolución por Zelle', ajuste: 'Ajuste' } as const;

const fecha = (f: string) =>
  new Date(f).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export function Billetera() {
  const currentUser = useAppStore((s) => s.currentUser);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const { datos, cargando, recargar } = useBilletera();

  useEffect(() => {
    if (!currentUser) useAppStore.getState().pedirRegistro({ tipo: 'vista', vista: 'billetera' });
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center space-y-4">
        <Wallet className="h-12 w-12 mx-auto text-[#123d83]" />
        <h1 className="text-2xl font-black text-[#071a46]">Mi billetera</h1>
        <p className="text-zinc-600">Entra o regístrate para ver tu saldo y tu código de recarga.</p>
        <Button onClick={() => useAppStore.getState().pedirRegistro({ tipo: 'vista', vista: 'billetera' })} className="bg-[#123d83] text-white">Entrar / Registrarse</Button>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
        {!cargando && <Button variant="outline" onClick={recargar}>Reintentar</Button>}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-6 py-5 pb-28 md:pb-8 space-y-4">
      <Card className="border-0 bg-[#071a46] text-white shadow-lg">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm text-blue-100"><Wallet className="h-4 w-4" /> Mi billetera</p>
            <button onClick={recargar} aria-label="Actualizar saldo" className="text-blue-200 hover:text-white">
              <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-4xl sm:text-5xl font-black text-[#7ed957] mt-2">${datos.saldo.toFixed(2)}</p>
          <p className="text-sm text-blue-100 mt-1">Saldo disponible para comprar</p>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-3">
            <div>
              <p className="text-xs text-blue-200">Tu código de recarga (siempre el mismo)</p>
              <p className="text-2xl font-black tracking-widest font-mono">{datos.codigo}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => copiar(datos.codigo, 'Código copiado')}><Copy className="h-4 w-4 mr-1" />Copiar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="text-lg font-bold text-[#071a46]">Cómo recargar</h2>
          <ol className="space-y-3 text-sm text-zinc-700">
            <li className="flex gap-3">
              <span className="h-6 w-6 shrink-0 rounded-full bg-[#123d83] text-white text-xs font-bold flex items-center justify-center">1</span>
              <div className="min-w-0">
                Abre Zelle en la app de tu banco y envía <b>la cantidad que quieras</b> a:
                <button onClick={() => copiar(datos.zelle, 'Correo de Zelle copiado')} className="mt-1 flex items-center gap-2 font-semibold text-[#123d83] [overflow-wrap:anywhere] text-left">
                  {datos.zelle} <Copy className="h-3.5 w-3.5 shrink-0" />
                </button>
                <span className="block text-xs text-zinc-500">En el banco aparece como LEISURE EXPORTING LLC.</span>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="h-6 w-6 shrink-0 rounded-full bg-[#123d83] text-white text-xs font-bold flex items-center justify-center">2</span>
              <div>En la nota (memo) del Zelle escribe solo tu código: <b className="font-mono text-base">{datos.codigo}</b></div>
            </li>
            <li className="flex gap-3">
              <span className="h-6 w-6 shrink-0 rounded-full bg-[#123d83] text-white text-xs font-bold flex items-center justify-center">3</span>
              <div>Cuando llega el aviso del banco, el saldo se suma solo y te llega un correo. Después compras con <b>Pagar con mi saldo</b> y la compra queda pagada al momento.</div>
            </li>
          </ol>
          <p className="text-xs text-zinc-500 rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2">
            Saldo máximo: ${datos.tope.toFixed(0)}. El saldo solo sirve para comprar en ambitosmax.com: no se transfiere a otras personas ni se cambia por efectivo.
            Si quieres que te devolvamos el saldo que no hayas usado, escríbenos a {datos.zelle} y te lo devolvemos por Zelle.
          </p>
          <Button onClick={() => setCurrentView('tienda')} className="w-full bg-[#123d83] hover:bg-[#071a46] text-white"><ShoppingBag className="h-4 w-4 mr-2" />Ir a la tienda</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-bold text-[#071a46] mb-3">Movimientos</h2>
          {datos.movimientos.length === 0 ? (
            <p className="text-sm text-zinc-500">Todavía no hay movimientos. Tu primera recarga aparecerá aquí.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {datos.movimientos.map((m) => {
                const entra = m.monto > 0;
                return (
                  <li key={m.id} className="py-2.5 flex items-start gap-3">
                    <span className={`mt-0.5 h-7 w-7 shrink-0 rounded-full flex items-center justify-center ${entra ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                      {entra ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900">{NOMBRE_TIPO[m.tipo]}{m.tipo === 'compra' && m.referencia ? ` ${m.referencia}` : ''}</p>
                      {m.detalle && <p className="text-xs text-zinc-500 [overflow-wrap:anywhere]">{m.detalle}</p>}
                      <p className="text-xs text-zinc-400">{fecha(m.fecha)}</p>
                    </div>
                    <span className={`text-sm font-bold whitespace-nowrap ${entra ? 'text-emerald-700' : 'text-zinc-800'}`}>{entra ? '+' : '−'}${Math.abs(m.monto).toFixed(2)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
