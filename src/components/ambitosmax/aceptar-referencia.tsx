'use client';

import { useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <Button onClick={() => setAceptado(true)} className="w-full h-auto whitespace-normal py-3 bg-[#123d83] hover:bg-[#071a46] text-white font-bold">
        Entendido, pondré {referencia} en la nota
      </Button>
    </div>
  );
}
