'use client';

import { useState } from 'react';
import { useAppStore } from './store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Flame, Loader2, MapPin, Clock, CheckCircle2, Search, Copy } from 'lucide-react';
import { toast } from 'sonner';

const PRECIO = 85;
const PUNTO = '"LOS AVIONCITOS" — Calle 210 / calle 31 y 33, Alturas de la Coronela, La Lisa, La Habana';

interface Resultado {
  numero: string;
  cantidad: number;
  montoUsd: number;
  zelle: string;
  lote: string;
  despuesDelCierre: boolean;
  instrucciones: string;
}

interface Consulta {
  numero: string;
  estado: 'pendiente_pago' | 'pagada' | 'entregada' | 'anulada';
  cantidad: number;
  montoUsd: number;
  lote: string;
  nombreRecoge: string;
  pin: string | null;
}

const ESTADO_TXT: Record<Consulta['estado'], string> = {
  pendiente_pago: 'Pendiente de pago',
  pagada: 'Pagada — lista para recoger',
  entregada: 'Entregada',
  anulada: 'Anulada',
};

function fechaBonita(dia: string) {
  return new Date(`${dia}T12:00:00Z`).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  });
}

export function ReservaCilindro() {
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const [form, setForm] = useState({
    nombreComprador: '', telefonoComprador: '', emailComprador: '',
    nombreRecoge: '', carnetRecoge: '', telefonoRecoge: '', cantidad: 1,
  });
  const [mismoQueRecoge, setMismoQueRecoge] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const [modoConsulta, setModoConsulta] = useState(false);
  const [cNumero, setCNumero] = useState('');
  const [cTelefono, setCTelefono] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [consulta, setConsulta] = useState<Consulta | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const reservar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!useAppStore.getState().currentUser) {
      useAppStore.getState().pedirRegistro({ tipo: 'vista', vista: 'reserva-cilindro' });
      return;
    }
    const datos = mismoQueRecoge
      ? { ...form, nombreRecoge: form.nombreComprador, telefonoRecoge: form.telefonoComprador }
      : form;
    if (!/^\d{11}$/.test(datos.carnetRecoge)) {
      toast.error('El carnet de quien recoge debe tener 11 dígitos');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/cilindros/reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...datos, website: honeypot }),
      });
      const json = await res.json();
      if (json.ok) setResultado(json.data);
      else if (json.requiereRegistro) useAppStore.getState().pedirRegistro({ tipo: 'vista', vista: 'reserva-cilindro' });
      else toast.error(json.error || 'No se pudo reservar');
    } catch {
      toast.error('Error de conexión');
    } finally {
      setEnviando(false);
    }
  };

  const consultar = async (e: React.FormEvent) => {
    e.preventDefault();
    setConsultando(true);
    setConsulta(null);
    try {
      const q = new URLSearchParams({ numero: cNumero.trim().toUpperCase(), telefono: cTelefono });
      const res = await fetch(`/api/cilindros/reserva?${q}`);
      const json = await res.json();
      if (json.ok) setConsulta(json.data);
      else toast.error(json.error || 'No encontrada');
    } catch {
      toast.error('Error de conexión');
    } finally {
      setConsultando(false);
    }
  };

  const copiar = (t: string) => {
    navigator.clipboard?.writeText(t).then(() => toast.success('Copiado')).catch(() => {});
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <button onClick={() => setCurrentView('tienda')} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver a la tienda
      </button>

      <div className="bg-[#071a46] text-white rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-2 text-[#7ed957] text-xs font-black uppercase tracking-widest">
          <Flame className="h-4 w-4" /> Reserva de cilindro
        </div>
        <h1 className="text-xl font-black mt-1">Cilindro lleno sin entrega de vacío</h1>
        <p className="text-2xl font-black text-[#7ed957] mt-1">${PRECIO}.00 <span className="text-sm text-white/60 font-semibold">USD c/u</span></p>
        <div className="mt-3 space-y-1.5 text-sm text-white/80">
          <p className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 mt-0.5" />{PUNTO}</p>
          <p className="flex gap-2"><Clock className="h-4 w-4 shrink-0 mt-0.5" />Las ventas cierran todos los días a las 8:00 PM. Las reservas pagadas antes del cierre entran en el listado de recogida de ese día.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setModoConsulta(false)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${!modoConsulta ? 'bg-[#123d83] text-white' : 'bg-white border border-zinc-200 text-zinc-600'}`}
        >Reservar</button>
        <button
          onClick={() => setModoConsulta(true)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${modoConsulta ? 'bg-[#123d83] text-white' : 'bg-white border border-zinc-200 text-zinc-600'}`}
        >Ya reservé: ver mi PIN</button>
      </div>

      {modoConsulta ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <form onSubmit={consultar} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Número de reserva</Label>
              <Input value={cNumero} onChange={(e) => setCNumero(e.target.value)} placeholder="RC-000001" className="uppercase font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tu teléfono (el que pusiste al reservar)</Label>
              <Input value={cTelefono} onChange={(e) => setCTelefono(e.target.value)} placeholder="+1 305 000 0000" inputMode="tel" />
            </div>
            <Button type="submit" disabled={consultando} className="w-full bg-[#123d83] hover:bg-[#071a46] text-white font-bold">
              {consultando ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-2" />Consultar</>}
            </Button>
          </form>
          {consulta && (
            <div className="mt-5 border-t border-zinc-100 pt-4 space-y-2 text-sm">
              <p><b>{consulta.numero}</b> · {consulta.cantidad} cilindro(s) · ${consulta.montoUsd.toFixed(2)}</p>
              <p>Estado: <b>{ESTADO_TXT[consulta.estado]}</b></p>
              <p>Recoge: {consulta.nombreRecoge} · Listado del {fechaBonita(consulta.lote)}</p>
              {consulta.pin && (
                <div className="bg-[#071a46] rounded-xl p-4 text-center mt-2">
                  <p className="text-[11px] text-white/60 uppercase tracking-widest">PIN de recogida</p>
                  <p className="text-4xl font-black font-mono tracking-[0.3em] text-[#7ed957]">{consulta.pin}</p>
                  <p className="text-xs text-white/70 mt-1">Dilo al llegar, junto con el carnet de identidad.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : resultado ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
          <div className="flex items-center gap-2 text-[#1f6b3a] font-bold">
            <CheckCircle2 className="h-5 w-5" /> Reserva creada: {resultado.numero}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm space-y-2">
            <p className="font-bold text-amber-900">Paga ${resultado.montoUsd.toFixed(2)} por Zelle</p>
            <p className="flex items-center gap-2">Zelle: <b className="font-mono">{resultado.zelle}</b>
              <button onClick={() => copiar(resultado.zelle)} className="text-[#123d83]"><Copy className="h-3.5 w-3.5" /></button></p>
            <p className="flex items-center gap-2">Referencia: <b className="font-mono">{resultado.numero}</b>
              <button onClick={() => copiar(resultado.numero)} className="text-[#123d83]"><Copy className="h-3.5 w-3.5" /></button></p>
          </div>
          <p className="text-sm text-zinc-600">
            Cuando confirmemos tu pago recibirás un <b>PIN de 6 dígitos</b>{form.emailComprador ? ' por correo' : ''}. Quien recoge debe presentar su carnet y decir el PIN.
            {resultado.despuesDelCierre
              ? ` Como reservaste después de las 8 PM, entras en el listado del ${fechaBonita(resultado.lote)}.`
              : ` Si pagas antes de las 8 PM de hoy, entras en el listado de hoy.`}
          </p>
          <p className="text-xs text-zinc-500">Guarda tu número {resultado.numero}: con él y tu teléfono puedes ver tu PIN en “Ya reservé”.</p>
          <Button onClick={() => { setResultado(null); }} variant="outline" className="w-full">Hacer otra reserva</Button>
        </div>
      ) : (
        <form onSubmit={reservar} className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
          <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name="website" />
          </div>

          <p className="text-xs font-black text-[#b45309] uppercase tracking-wide">1. Quien paga</p>
          <div className="space-y-1.5"><Label className="text-xs">Nombre completo *</Label><Input value={form.nombreComprador} onChange={set('nombreComprador')} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Teléfono *</Label><Input value={form.telefonoComprador} onChange={set('telefonoComprador')} inputMode="tel" required /></div>
            <div className="space-y-1.5"><Label className="text-xs">Correo (para el PIN)</Label><Input type="email" value={form.emailComprador} onChange={set('emailComprador')} /></div>
          </div>

          <p className="text-xs font-black text-[#b45309] uppercase tracking-wide pt-2">2. Quien recoge en Cuba</p>
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input type="checkbox" checked={mismoQueRecoge} onChange={(e) => setMismoQueRecoge(e.target.checked)} />
            Recojo yo mismo
          </label>
          {!mismoQueRecoge && (
            <>
              <div className="space-y-1.5"><Label className="text-xs">Nombre completo *</Label><Input value={form.nombreRecoge} onChange={set('nombreRecoge')} required={!mismoQueRecoge} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Teléfono en Cuba</Label><Input value={form.telefonoRecoge} onChange={set('telefonoRecoge')} inputMode="tel" /></div>
            </>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Carnet de identidad de quien recoge * (11 dígitos)</Label>
            <Input
              value={form.carnetRecoge}
              onChange={(e) => setForm((f) => ({ ...f, carnetRecoge: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
              inputMode="numeric"
              className="font-mono"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Label className="text-sm font-bold">Cantidad de cilindros</Label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm((f) => ({ ...f, cantidad: Math.max(1, f.cantidad - 1) }))} className="w-9 h-9 rounded-full border border-zinc-300 font-bold">−</button>
              <span className="w-6 text-center font-bold">{form.cantidad}</span>
              <button type="button" onClick={() => setForm((f) => ({ ...f, cantidad: Math.min(4, f.cantidad + 1) }))} className="w-9 h-9 rounded-full border border-zinc-300 font-bold">+</button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
            <span className="text-sm text-zinc-500">Total</span>
            <span className="text-2xl font-black text-[#123d83]">${(PRECIO * form.cantidad).toFixed(2)}</span>
          </div>

          <Button type="submit" disabled={enviando} className="w-full h-12 bg-[#55b949] hover:bg-[#3f9a35] text-white font-bold text-base">
            {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Reservar y pagar por Zelle'}
          </Button>
        </form>
      )}
    </div>
  );
}
