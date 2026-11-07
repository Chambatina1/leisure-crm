'use client';

import { useState, type ReactNode } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Antes de mostrar a dónde pagar por Zelle, el cliente tiene que aceptar que
 * escribirá su referencia en la nota del pago. Sin la referencia el pago no se
 * puede identificar y no se envía el PIN.
 */
export function AceptarReferencia({ referencia, children }: { referencia: string; children: ReactNode }) {
  const [aceptado, setAceptado] = useState(false);
  if (aceptado) return <>{children}</>;
  return (
    <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-3 space-y-2">
      <p className="flex items-center gap-2 font-bold text-amber-900">
        <AlertTriangle className="h-5 w-5 shrink-0" /> Antes de pagar
      </p>
      <p className="text-sm text-zinc-800">En la nota (memo) del Zelle tienes que escribir esta referencia:</p>
      <p className="text-center text-2xl font-black font-mono tracking-wider text-[#071a46] bg-white rounded-lg py-2 border border-amber-200">
        {referencia}
      </p>
      <p className="text-xs font-semibold text-red-700">
        Si el pago llega sin la referencia, no podemos saber que es tuyo: no se confirma y no recibes el PIN.
      </p>
      {/* Botón grande y llamativo: hay que tocarlo para ver a dónde pagar */}
      <div className="flex items-center gap-1">
        <ChevronRight className="h-5 w-5 shrink-0 text-[#2563eb] animate-pulse" aria-hidden />
        <button
          type="button"
          onClick={() => setAceptado(true)}
          className="relative flex-1 rounded-2xl bg-gradient-to-b from-[#1d4fb8] to-[#0b2a6b] px-2 py-3 text-white shadow-[0_0_0_4px_rgba(59,130,246,0.35),0_6px_14px_rgba(7,26,70,0.35)] ring-2 ring-white/70 active:scale-[0.98] transition-transform"
        >
          <span className="absolute inset-0 rounded-2xl ring-4 ring-blue-400/70 animate-pulse pointer-events-none" aria-hidden />
          <span className="flex items-center justify-center gap-1.5 text-base sm:text-lg font-black leading-tight whitespace-nowrap">
            <CheckCircle2 className="h-5 w-5 shrink-0" /> Entendido, continuar <ArrowRight className="h-5 w-5 shrink-0" />
          </span>
          <span className="mt-0.5 block text-xs font-semibold text-white/90">Toca aquí para ver cómo pagar</span>
        </button>
        <ChevronLeft className="h-5 w-5 shrink-0 text-[#2563eb] animate-pulse" aria-hidden />
      </div>
    </div>
  );
}
