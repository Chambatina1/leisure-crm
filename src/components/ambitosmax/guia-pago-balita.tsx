'use client';

import { useState, type ReactNode } from 'react';
import {
  AlertTriangle, CalendarDays, CheckCircle2, Clock, Copy, DollarSign, Landmark, MapPin, NotebookPen, Search, Send, ShieldCheck, UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TITULAR_ZELLE } from './pasos-zelle';
import { AceptarReferencia } from './aceptar-referencia';

function copiar(texto: string, aviso: string) {
  navigator.clipboard?.writeText(texto).then(
    () => toast.success(aviso),
    () => toast.error('No se pudo copiar; cópialo a mano')
  );
}

function BotonCopiar({ valor, aviso }: { valor: string; aviso: string }) {
  return (
    <Button type="button" size="sm" variant="outline" onClick={() => copiar(valor, aviso)} className="h-8 w-full text-xs">
      <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
    </Button>
  );
}

function Paso({ n, icono, titulo, children }: { n: number; icono: ReactNode; titulo: string; children: ReactNode }) {
  return (
    <li className="flex gap-3 rounded-xl border border-blue-100 bg-white p-2.5 sm:p-3 md:flex-col md:items-center md:text-center">
      <div className="flex flex-col items-center gap-1 shrink-0">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#071a46] text-sm font-black text-white">{n}</span>
        <span className="text-[#123d83]">{icono}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 md:w-full">
        <p className="font-bold text-[#071a46] leading-tight">{titulo}</p>
        {children}
      </div>
    </li>
  );
}

/**
 * Pantalla después de reservar balitas: todo lo que el cliente necesita para
 * pagar por Zelle sin confundirse, en el orden en que lo va a hacer.
 */
export function GuiaPagoBalita({
  referencia,
  resumen,
  monto,
  zelle,
  punto,
  recogida,
  onVerEstado,
}: {
  referencia: string;
  resumen: string;
  monto: number;
  zelle: string;
  punto?: string;
  recogida?: string;
  onVerEstado?: () => void;
}) {
  const [vence] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
  const hora = vence.toLocaleTimeString('es-US', { hour: 'numeric', minute: '2-digit' });
  const montoTxt = `$${monto.toFixed(2)}`;

  return (
    <div className="space-y-3">
      {/* 1-3. Reservada, pedido y plazo de 1 hora, todo en una tarjeta compacta */}
      <div className="overflow-hidden rounded-2xl border-2 border-[#071a46]">
        <div className="bg-[#071a46] px-3 py-2.5 text-white flex items-center gap-2.5">
          <CheckCircle2 className="h-7 w-7 shrink-0 text-[#7ed957]" />
          <div className="min-w-0 flex-1">
            <p className="text-base sm:text-lg font-black leading-tight">¡Tu balita está reservada!</p>
            <p className="text-xs text-white/80">Todavía NO está pagada</p>
          </div>
          <span className="shrink-0 rounded-lg bg-white px-2 py-1 font-mono text-sm font-black text-[#071a46]">{referencia}</span>
        </div>
        <div className="flex items-center justify-between gap-3 bg-blue-50/60 px-3 py-2">
          <p className="min-w-0 text-xs font-semibold text-zinc-700 leading-snug">{resumen}</p>
          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 leading-none">Total a pagar</p>
            <p className="text-xl font-black text-[#071a46] leading-tight">{montoTxt}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
          <Clock className="h-5 w-5 shrink-0 text-amber-700" />
          <p className="text-xs leading-snug">
            <b className="text-sm">Paga antes de las {hora.replace(/\.$/, '')}</b> (1 hora). Si no, la reserva se cancela sola.
          </p>
        </div>
      </div>

      <AceptarReferencia referencia={referencia}>
      <div className="space-y-4">
      {/* 4. Cómo pagar */}
      <div className="rounded-2xl border-2 border-[#123d83] p-2.5 sm:p-4 space-y-2">
        <p className="text-center text-base sm:text-lg font-black text-[#071a46]">Cómo pagar por Zelle, paso a paso</p>
        <ol className="grid gap-2 md:grid-cols-5">
          <Paso n={1} icono={<Landmark className="h-5 w-5" />} titulo="Abre la app de tu banco">
            <p className="text-xs text-zinc-600">Entra en Zelle y toca <b>Enviar dinero (Send)</b>.</p>
          </Paso>
          <Paso n={2} icono={<UserPlus className="h-5 w-5" />} titulo="Agrega este destinatario">
            <p className="font-mono text-xs font-bold text-[#071a46] break-all rounded bg-zinc-100 px-2 py-1">{zelle}</p>
            <BotonCopiar valor={zelle} aviso="Correo de Zelle copiado" />
            <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 md:justify-center">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Debe salir: {TITULAR_ZELLE}
            </p>
            <p className="text-[11px] text-zinc-500">No uses un teléfono ni un contacto guardado.</p>
          </Paso>
          <Paso n={3} icono={<DollarSign className="h-5 w-5" />} titulo="Escribe el monto exacto">
            <p className="text-xl font-black text-[#071a46]">{montoTxt}</p>
            <BotonCopiar valor={monto.toFixed(2)} aviso="Monto copiado" />
          </Paso>
          <Paso n={4} icono={<NotebookPen className="h-5 w-5" />} titulo="Pon la referencia en la nota (memo)">
            <p className="font-mono text-lg font-black text-[#071a46] rounded bg-zinc-100 px-2 py-1">{referencia}</p>
            <BotonCopiar valor={referencia} aviso="Referencia copiada" />
            <p className="text-[11px] font-semibold text-red-700">Va en la nota. No es el destinatario.</p>
          </Paso>
          <Paso n={5} icono={<Send className="h-5 w-5" />} titulo="Revisa y envía">
            <p className="text-xs text-zinc-600">
              Comprueba que salga <b>{TITULAR_ZELLE}</b>, el monto <b>{montoTxt}</b> y la nota <b>{referencia}</b>. Después envía.
            </p>
          </Paso>
        </ol>
      </div>

      {/* 5. Atención */}
      <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-3 sm:p-4 flex gap-3 text-sm text-red-900">
        <AlertTriangle className="h-7 w-7 shrink-0" />
        <div className="space-y-1">
          <p className="font-black">¡Atención antes de enviar!</p>
          <p>
            Tu banco debe mostrar exactamente <b>{TITULAR_ZELLE}</b>. Si aparece otro nombre (una tienda, un restaurante, una persona), <b>no envíes el dinero</b>.
          </p>
          <p>Un Zelle enviado a otra persona no se puede devolver.</p>
        </div>
      </div>

      {/* 6. Después */}
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-3 sm:p-4 space-y-2">
        <p className="font-black text-[#1f6b3a] flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> ¿Qué pasa después del pago?</p>
        <ol className="space-y-1 text-sm text-zinc-800">
          <li><b>1.</b> Recibimos tu Zelle y lo comprobamos con la referencia {referencia}.</li>
          <li><b>2.</b> Tu compra se confirma sola.</li>
          <li><b>3.</b> Te llega por correo el <b>PIN de recogida</b>, normalmente en pocos minutos.</li>
        </ol>
      </div>

      {/* 7. Recogida */}
      {(recogida || punto) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {recogida && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 flex gap-3">
              <CalendarDays className="h-6 w-6 shrink-0 text-[#123d83]" />
              <div className="text-sm">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Fecha de recogida (si pagas hoy)</p>
                <p className="font-bold text-[#071a46]">{recogida}</p>
              </div>
            </div>
          )}
          {punto && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 flex gap-3">
              <MapPin className="h-6 w-6 shrink-0 text-[#123d83]" />
              <div className="text-sm">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Punto de recogida</p>
                <p className="font-bold text-[#071a46]">{punto}</p>
                <p className="text-xs text-zinc-500">Quien recoge presenta su carnet y dice el PIN.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. Ya pagué */}
      {onVerEstado && (
        <div className="rounded-2xl bg-[#071a46] p-4 text-white space-y-3">
          <div className="flex items-start gap-3">
            <Search className="h-6 w-6 shrink-0 mt-0.5 text-[#7ed957]" />
            <div className="min-w-0">
              <p className="text-lg font-black leading-tight">¿Ya realizaste el pago?</p>
              <p className="text-sm text-white/85 mt-1">
                Aquí ves si tu pago ya llegó y tu PIN de recogida. Ten a mano tu número <b className="font-mono text-white">{referencia}</b>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onVerEstado}
            className="w-full min-h-12 rounded-xl bg-[#55b949] px-4 py-3 text-base font-black text-white hover:bg-[#46a03b]"
          >
            Ver el estado y mi PIN
          </button>
        </div>
      )}
      </div>
      </AceptarReferencia>
    </div>
  );
}

/** Guía corta, antes de comprar, de cómo funciona la compra de balitas. */
export function ComoComprarBalita() {
  const pasos = [
    ['Elige', 'la cantidad de balitas y el punto donde se recogen.'],
    ['Escribe', 'tus datos y los de quien recoge en Cuba (nombre y carnet).'],
    ['Reserva', 'y te damos un número RC-. La balita queda apartada 1 hora.'],
    ['Paga por Zelle', 'desde la app de tu banco, con el número RC- en la nota.'],
    ['Recibe el PIN', 'por correo. Quien recoge va con su carnet y dice el PIN.'],
  ];
  return (
    <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/60 p-4 space-y-2">
      <p className="font-black text-[#071a46]">Así funciona tu compra</p>
      <ol className="grid gap-2 sm:grid-cols-5">
        {pasos.map(([t, d], i) => (
          <li key={t} className="flex gap-2 sm:flex-col rounded-xl bg-white border border-blue-100 p-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#123d83] text-xs font-black text-white">{i + 1}</span>
            <p className="text-xs text-zinc-700"><b className="text-[#071a46]">{t}</b> {d}</p>
          </li>
        ))}
      </ol>
      <p className="text-xs text-zinc-600">El pago es solo por Zelle. Sin el número RC- en la nota no podemos saber que el pago es tuyo.</p>
    </div>
  );
}
