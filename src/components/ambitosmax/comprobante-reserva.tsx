'use client';

import { useState } from 'react';
import { Clock, FileCheck2 } from 'lucide-react';

/**
 * Comprobante de reserva: el número RC- es la evidencia de que la balita
 * quedó reservada, pero solo durante 1 hora, para dar tiempo al pago por Zelle.
 */
export function ComprobanteReserva({ referencia, resumen, monto }: { referencia: string; resumen?: string; monto: number }) {
  // Hora límite en la hora del teléfono del cliente (se calcula al crear la reserva)
  const [vence] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
  const hora = vence.toLocaleTimeString('es-US', { hour: 'numeric', minute: '2-digit' });
  return (
    <div className="rounded-2xl border-2 border-[#123d83] bg-blue-50 p-4 space-y-3">
      <p className="flex items-center gap-2 font-bold text-[#071a46]">
        <FileCheck2 className="h-5 w-5 shrink-0" /> Comprobante de reserva
      </p>
      <p className="text-center text-4xl font-black font-mono tracking-wider text-[#071a46] bg-white rounded-xl py-3 border border-blue-200">
        {referencia}
      </p>
      {resumen && <p className="text-sm text-zinc-700 text-center">{resumen} · <b>${monto.toFixed(2)}</b></p>}
      <div className="rounded-xl bg-amber-50 border-2 border-amber-300 p-3 text-sm text-amber-900 space-y-1">
        <p className="flex items-center gap-2 font-bold">
          <Clock className="h-4 w-4 shrink-0" /> Reservada solo 1 hora: hasta las {hora}
        </p>
        <p>
          Te guardamos la balita durante 1 hora para darte tiempo a pagar por Zelle. Si el pago no llega en esa hora, la reserva
          se cancela sola y la balita vuelve a la venta.
        </p>
      </div>
      <p className="text-xs text-zinc-600">Guarda este número {referencia}: es la prueba de tu reserva y la referencia que va en la nota del Zelle.</p>
    </div>
  );
}
