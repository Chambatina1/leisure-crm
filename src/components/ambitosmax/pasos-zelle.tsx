'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, Copy, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/** Nombre con el que sale registrada nuestra cuenta de Zelle en el banco del cliente. */
export const TITULAR_ZELLE = 'LEISURE EXPORTING LLC';

function copiar(texto: string, aviso = 'Copiado') {
  navigator.clipboard?.writeText(texto).then(
    () => toast.success(aviso),
    () => toast.error('No se pudo copiar; cópialo a mano')
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">{etiqueta}</p>
        <p className="font-mono font-bold text-[#071a46] break-all">{valor}</p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={() => copiar(valor, `${etiqueta} copiado`)} className="shrink-0">
        <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
      </Button>
    </div>
  );
}

function Paso({ n, titulo, children }: { n: number; titulo: string; children?: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#123d83] text-sm font-bold text-white">{n}</span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-semibold text-zinc-900">{titulo}</p>
        {children}
      </div>
    </li>
  );
}

/**
 * Pasos para pagar por Zelle, muy explicados. Lo usan la tienda y la página de
 * reserva de balitas. Zelle no se puede devolver: si el cliente escribe mal el
 * destinatario, el dinero va a otra persona.
 */
export function PasosZelle({
  zelle,
  monto,
  referencia,
  conPin,
  despues,
}: {
  zelle: string;
  monto: number;
  referencia: string;
  conPin: boolean;
  despues?: ReactNode;
}) {
  const montoTxt = `$${monto.toFixed(2)}`;
  const todo = `Zelle a: ${zelle}\nA nombre de: ${TITULAR_ZELLE}\nMonto: ${montoTxt}\nNota (memo): ${referencia}`;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-red-300 bg-red-50 p-3 text-sm text-red-900 space-y-1">
        <p className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4 shrink-0" /> Lee esto antes de pagar</p>
        <p>Un Zelle enviado a otra persona <b>no se puede devolver</b>. Si te equivocas de destinatario, el dinero no nos llega y no podemos entregarte nada.</p>
      </div>

      {conPin && (
        <p className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          Tienes <b>1 hora</b> para pagar. Te apartamos la balita durante esa hora; si no llega tu Zelle, la compra se cancela y la balita vuelve a la venta.
        </p>
      )}

      <p className="text-sm text-zinc-700">Zelle se paga desde la app de tu banco. Deja esta página abierta mientras pagas para copiar los datos.</p>

      <ol className="space-y-5">
        <Paso n={1} titulo="Abre la app de tu banco y entra en Zelle">
          <p className="text-sm text-zinc-600">Busca &quot;Zelle&quot;, &quot;Send money with Zelle&quot; o &quot;Enviar dinero&quot;, y toca <b>Enviar (Send)</b>.</p>
        </Paso>

        <Paso n={2} titulo="Agrega un destinatario NUEVO con este correo">
          <Dato etiqueta="Correo de Zelle" valor={zelle} />
          <ul className="text-sm text-zinc-700 list-disc pl-5 space-y-1">
            <li>Toca <b>&quot;Agregar destinatario&quot; / &quot;Add recipient&quot;</b> y <b>pega el correo</b> con el botón Copiar. No lo escribas a mano.</li>
            <li><b>No</b> pongas un número de teléfono, <b>no</b> busques por nombre y <b>no</b> elijas un contacto que ya tenías guardado.</li>
            <li>Si el banco te pide un nombre para el contacto, escribe <b>Leisure Exporting</b>.</li>
          </ul>
        </Paso>

        <Paso n={3} titulo="Comprueba a nombre de quién está">
          <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50 p-3 text-sm space-y-1">
            <p className="flex items-center gap-2 font-semibold text-emerald-900"><ShieldCheck className="h-4 w-4 shrink-0" /> Tu banco tiene que mostrar:</p>
            <p className="text-lg font-black text-[#071a46]">{TITULAR_ZELLE}</p>
          </div>
          <p className="text-sm font-semibold text-red-700">
            Si sale cualquier otro nombre (un restaurante, una tienda, una persona), NO envíes. Ese no es nuestro Zelle: borra el destinatario y vuelve al paso 2.
          </p>
        </Paso>

        <Paso n={4} titulo="Escribe el monto exacto">
          <Dato etiqueta="Monto" valor={montoTxt} />
        </Paso>

        <Paso n={5} titulo="En la nota (memo) pega tu referencia">
          <Dato etiqueta="Nota / Memo" valor={referencia} />
          <p className="text-sm text-red-700 font-medium">
            Sin {referencia} en la nota no sabemos que el pago es tuyo{conPin ? ': no se confirma y no recibes el PIN' : ''}.
          </p>
        </Paso>

        <Paso n={6} titulo="Revisa los 3 datos y envía">
          <p className="text-sm text-zinc-600">
            Destinatario <b>{TITULAR_ZELLE}</b>, monto <b>{montoTxt}</b> y nota <b>{referencia}</b>.{' '}
            {conPin
              ? 'Cuando nos llega el pago se confirma solo y te mandamos el PIN de recogida por correo, normalmente en pocos minutos.'
              : 'Cuando recibimos el pago confirmamos tu pedido y te avisamos por correo.'}
          </p>
          {despues}
        </Paso>
      </ol>

      <Button type="button" variant="outline" className="w-full" onClick={() => copiar(todo, 'Datos de pago copiados')}>
        <Copy className="h-4 w-4 mr-2" /> Copiar todos los datos de pago
      </Button>
    </div>
  );
}
