'use client';

import { useEffect, useState } from 'react';

// Cuenta atrás hasta el cierre de ventas del día (8:00 PM hora de Cuba).
// Pasado el cierre, avisa de que la reserva entra en el listado de mañana.
const HORA_CIERRE = 20;

function segundosHastaCierre() {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Havana',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const n = (t: string) => Number(partes.find((p) => p.type === t)?.value ?? 0);
  const ahora = n('hour') * 3600 + n('minute') * 60 + n('second');
  return HORA_CIERRE * 3600 - ahora;
}

const dos = (n: number) => String(n).padStart(2, '0');

export function CierreCountdown({ className = '' }: { className?: string }) {
  const [seg, setSeg] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setSeg(segundosHastaCierre());
    const primero = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => { clearTimeout(primero); clearInterval(t); };
  }, []);

  // Antes de hidratar mostramos el dato fijo, que también es lo que lee Google.
  if (seg === null) return <span className={className}>Las ventas del día cierran a las 8:00 PM (hora de Cuba)</span>;
  if (seg <= 0) return <span className={className}>Ventas de hoy cerradas · Reserva ahora y tu balita entra en el listado de mañana</span>;

  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  return (
    <span className={className}>
      Las ventas de hoy cierran en <b className="font-mono tabular-nums">{dos(h)}:{dos(m)}:{dos(s)}</b> · 8:00 PM hora de Cuba
    </span>
  );
}
