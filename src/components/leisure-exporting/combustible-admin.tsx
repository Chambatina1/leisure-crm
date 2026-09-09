'use client';

// ═══════════════════════════════════════════════════════════════════
// ADMIN COMBUSTIBLE — solicitudes de combustible CUPET
// Confirmar pago Zelle → PIN automático de CUPET
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, RefreshCw, Copy, Check, X, Phone, MapPin, Fuel } from 'lucide-react';

interface Solicitud {
  id: number;
  numero: string;
  nombreComprador: string;
  telefonoComprador: string;
  nombreBeneficiario: string;
  ciBeneficiario: string;
  telefonoCuba: string;
  servicenterNombre: string;
  typeFuelNombre: string;
  litros: number;
  montoUsd: number;
  estado: string;
  pin: string | null;
  cupetTransactionId: number | null;
  createdAt: string;
}

export function CombustibleAdmin() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [procesando, setProcesando] = useState<number | null>(null);
  const [pinCopiado, setPinCopiado] = useState<number | null>(null);

  const clave = 'leisure-exporting2024'; // fase 1 — misma clave del panel

  const [stock, setStock] = useState<Array<{ servicenterId: number; estacionNombre: string; direccion: string; combustible: string; amount: number; priceXLiter: number; totalUsd: number; mapsUrl: string }>>([]);

  const cargarStock = useCallback(async () => {
    try {
      const r = await fetch('/api/cupet/stock', { headers: { 'x-admin-password': clave } });
      const j = await r.json();
      if (j.ok) setStock(j.data);
    } catch { /* silencioso */ }
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const r = await fetch('/api/cupet/solicitud', { headers: { 'x-admin-password': clave } });
      const j = await r.json();
      if (j.ok) setSolicitudes(j.data);
    } catch {
      setMensaje('Error de conexión');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); cargarStock(); }, [cargar, cargarStock]);

  const confirmar = async (id: number) => {
    setProcesando(id);
    setMensaje('');
    try {
      const r = await fetch(`/api/cupet/solicitud/${id}/confirmar`, {
        method: 'POST',
        headers: { 'x-admin-password': clave },
      });
      const j = await r.json();
      if (j.ok) {
        setMensaje(`✅ Pago confirmado — PIN generado: ${j.data.pin}`);
        cargar();
      } else {
        setMensaje(`❌ ${j.error}${j.detalle ? `: ${j.detalle}` : ''}`);
      }
    } catch {
      setMensaje('Error de conexión');
    } finally {
      setProcesando(null);
    }
  };

  const copiarPin = (s: Solicitud) => {
    if (s.pin) {
      navigator.clipboard.writeText(`Leisure Exporting — Combustible
Orden: ${s.cupetTransactionId}
PIN de carga: ${s.pin}
${s.typeFuelNombre} · ${s.litros} litros
Estación: ${s.servicenterNombre}
Beneficiario: ${s.nombreBeneficiario}`);
      setPinCopiado(s.id);
      setTimeout(() => setPinCopiado(null), 2500);
    }
  };

  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente_pago');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#123d83] to-[#071a46] flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-[#55b949]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900">Combustible</h1>
            <p className="text-sm text-zinc-500">{pendientes.length} solicitud(es) pendiente(s) de pago</p>
          </div>
        </div>
        <Button variant="secondary" onClick={cargar}><RefreshCw className="w-4 h-4 mr-1" /> Actualizar</Button>
      </div>

      {/* ═══ MI STOCK: dónde está la gasolina ═══ */}
      {stock.length > 0 && (
        <Card className="bg-gradient-to-r from-[#071a46] to-[#123d83] text-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Fuel className="w-5 h-5 text-[#7ed957]" />
              <h2 className="font-black">Mi combustible — dónde está tu gasolina</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {stock.map((s, i) => (
                <a key={i} href={s.mapsUrl} target="_blank" rel="noopener noreferrer"
                   className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{s.combustible}</span>
                    <span className="text-xl font-black text-[#7ed957]">{s.amount} L</span>
                  </div>
                  <p className="text-sm text-white/80 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {s.estacionNombre}
                  </p>
                  <p className="text-xs text-white/50">{s.direccion}</p>
                  <p className="text-xs text-white/60 mt-1">
                    ${s.priceXLiter.toFixed(2)}/L · valor total ${s.totalUsd.toFixed(2)} · clic para ver en el mapa →
                  </p>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {mensaje && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-xl px-4 py-3 font-semibold">
          {mensaje}
        </div>
      )}

      {cargando && [1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}

      {!cargando && solicitudes.length === 0 && (
        <Card><CardContent className="p-10 text-center text-zinc-400 text-sm">
          Aún no hay solicitudes — aparecerán aquí cuando los clientes las creen desde la web.
        </CardContent></Card>
      )}

      {solicitudes.map((s) => (
        <Card key={s.id} className={s.estado === 'pagada' ? 'border-l-4 border-l-[#55b949]' : 'border-l-4 border-l-amber-400'}>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1 min-w-[250px]">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-zinc-900">{s.numero}</span>
                  <Badge>{s.estado === 'pendiente_pago' ? 'PENDIENTE PAGO' : s.estado === 'pagada' ? 'PAGADA' : s.estado.toUpperCase()}</Badge>
                </div>
                <p className="text-sm text-zinc-600">
                  <b>{s.typeFuelNombre}</b> · {s.litros} litros · ${s.montoUsd.toFixed(2)}
                </p>
                <p className="text-sm text-zinc-500">⛽ {s.servicenterNombre}</p>
                <p className="text-sm text-zinc-500">
                  👤 {s.nombreBeneficiario} · CI {s.ciBeneficiario} · <Phone className="w-3 h-3 inline" /> {s.telefonoCuba}
                </p>
                <p className="text-xs text-zinc-400">Solicitó: {s.nombreComprador} ({s.telefonoComprador}) · {new Date(s.createdAt).toLocaleString('es-ES')}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                {s.estado === 'pendiente_pago' && (
                  <>
                    <Button
                      className="bg-[#55b949] hover:bg-[#348f39]"
                      disabled={procesando === s.id}
                      onClick={() => confirmar(s.id)}
                    >
                      {procesando === s.id ? 'Registrando orden…' : '✅ Pago recibido → Generar PIN'}
                    </Button>
                    <p className="text-[11px] text-zinc-400">Confirma solo cuando el Zelle llegó</p>
                  </>
                )}
                {s.estado === 'pagada' && s.pin && (
                  <div className="text-right">
                    <div className="bg-[#071a46] rounded-xl px-5 py-3">
                      <p className="text-[10px] text-white/50 uppercase tracking-widest">PIN de carga</p>
                      <p className="text-2xl font-black font-mono text-white tracking-widest">{s.pin}</p>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">Orden CUPET #{s.cupetTransactionId}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => copiarPin(s)}>
                      {pinCopiado === s.id ? <><Check className="w-4 h-4 mr-1" />¡Copiado!</> : <><Copy className="w-4 h-4 mr-1" />Copiar mensaje WhatsApp</>}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}
