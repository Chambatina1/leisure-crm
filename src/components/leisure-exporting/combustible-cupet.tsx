'use client';

// ═══════════════════════════════════════════════════════════════════
// COMBUSTIBLE CUPET — venta de combustible en gasolineras de Cuba
// Flujo: estación → tipo + litros → datos del beneficiario → PIN
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, MapPin, Droplets, User, ChevronLeft, Copy, Check } from 'lucide-react';

interface Servicentro { servicenterId: number; servicenterName: string; address: string }
interface TipoFuel { typeFuelId: number; typeFuelName: string; typeFuelAlias?: string }
interface ResultadoOrden {
  externalId: string;
  data?: {
    success?: boolean;
    code?: number;
    transactionId?: number;
    pin?: string;
    expirationDate?: string;
    message?: string;
    errors?: string[];
  };
}

const PROVINCIAS = ['La Habana', 'Matanzas', 'Villa Clara', 'Cienfuegos', ' Sancti Spíritus', 'Ciego de Ávila', 'Camagüey', 'Las Tunas', 'Holguín', 'Granma', 'Santiago de Cuba', 'Guantánamo', 'Pinar del Río', 'Artemisa', 'Mayabeque', 'Isle'];

export function CombustibleCupet() {
  const { goBackToPublic } = useAppStore();
  const [paso, setPaso] = useState(1);
  const [estaciones, setEstaciones] = useState<Servicentro[]>([]);
  const [tipos, setTipos] = useState<TipoFuel[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [stock, setStock] = useState<Array<{ servicenterId: number; typeFuelId: number; combustible: string; litros: number; precio: number }>>([]);

  const [estacion, setEstacion] = useState<Servicentro | null>(null);
  const [tipo, setTipo] = useState<TipoFuel | null>(null);
  const [litros, setLitros] = useState('');
  const [nombre, setNombre] = useState('');
  const [nombreBeneficiario, setNombreBeneficiario] = useState('');
  const [telefonoBeneficiario, setTelefonoBeneficiario] = useState('');
  const [ci, setCi] = useState('');
  const [telefono, setTelefono] = useState(''); // teléfono de quien paga
  const [montoPagado, setMontoPagado] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoOrden | null>(null);
  const [solicitud, setSolicitud] = useState<{ numero: string; montoUsd: number; zelle: string; instrucciones: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/cupet/servicentros').then((r) => r.json()),
      fetch('/api/cupet/tipos').then((r) => r.json()),
      fetch('/api/cupet/stock-public').then((r) => r.json()),
    ])
      .then(([e, t, k]) => {
        if (e.ok) setEstaciones(e.data || []);
        else setError(e.error || 'No se pudo cargar las estaciones');
        if (t.ok) setTipos(t.data || []);
        if (k.ok) setStock(k.data || []);
      })
      .catch(() => setError('Error de conexión, intenta de nuevo'))
      .finally(() => setCargando(false));
  }, []);

  const enviar = async () => {
    setEnviando(true);
    setError('');
    try {
      // Calcular monto: litros × precio (se toma del campo montoPagado)
      const res = await fetch('/api/cupet/solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreComprador: nombre,
          telefonoComprador: telefono,
          nombreBeneficiario: nombreBeneficiario,
          ciBeneficiario: ci,
          telefonoCuba: telefonoBeneficiario,
          servicenterId: estacion!.servicenterId,
          servicenterNombre: estacion!.servicenterName,
          typeFuelId: tipo!.typeFuelId,
          typeFuelNombre: tipo!.typeFuelName,
          litros: parseFloat(litros),
          montoUsd: totalAuto,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setSolicitud(json.data);
        setPaso(4);
      } else {
        setError(json.error || 'No se pudo crear la solicitud');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setEnviando(false);
    }
  };

  const copiarPin = () => {
    if (resultado?.data?.pin) {
      navigator.clipboard.writeText(resultado.data.pin!);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const combustiblesEn = (sid: number) => stock.filter((k) => k.servicenterId === sid);
  const precioDe = (sid: number, tid: number) => stock.find((k) => k.servicenterId === sid && k.typeFuelId === tid);
  const totalAuto = estacion && tipo && litros ? (precioDe(estacion.servicenterId, tipo.typeFuelId)?.precio ?? 0) * parseFloat(litros) : 0;

  const [soloConStock, setSoloConStock] = useState(true);
  const [mapa, setMapa] = useState<{ titulo: string; query: string } | null>(null);
  const estacionesConStock = new Set(stock.map((k) => k.servicenterId));
  const totalLitros = stock.reduce((s2, k) => s2 + k.litros, 0);
  const resumenCombustibles = Object.values(
    stock.reduce((acc: Record<number, { combustible: string; litros: number; precio: number }>, k) => {
      acc[k.typeFuelId] = acc[k.typeFuelId] || { combustible: k.combustible, litros: 0, precio: k.precio };
      acc[k.typeFuelId].litros += k.litros;
      return acc;
    }, {})
  );

  const estacionesFiltradas = estaciones.filter(
    (e) =>
      (!soloConStock || estacionesConStock.has(e.servicenterId)) &&
      (!busqueda ||
        e.servicenterName.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.address.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={goBackToPublic} className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#123d83] to-[#071a46] flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-[#55b949]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900">Combustible</h1>
            <p className="text-sm text-zinc-500">Carga en gasolineras de Cuba — recibe tu PIN al instante</p>
          </div>
        </div>
      </div>

      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`flex-1 h-1.5 rounded-full ${paso >= n ? 'bg-[#123d83]' : 'bg-zinc-200'}`} />
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
      )}

      {cargando && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          <p className="text-center text-sm text-zinc-400">Consultando gasolineras por el túnel seguro…</p>
        </div>
      )}

      {/* ═══ BANNER: dónde hay combustible HOY ═══ */}
      {paso === 1 && !cargando && stock.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#071a46] via-[#123d83] to-[#1a4fa0] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden mb-4"
        >
          <div className="absolute -right-4 -top-8 text-[110px] leading-none opacity-10 select-none">⛽</div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Combustible disponible HOY</p>
          <div className="flex items-end gap-3 mt-1">
            <span className="text-4xl font-black text-[#7ed957]">{totalLitros.toLocaleString('es-ES')} L</span>
            <span className="text-sm text-white/60 mb-1.5">
              en {estacionesConStock.size} estación{estacionesConStock.size !== 1 ? 'es' : ''} de Cuba
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {resumenCombustibles.map((k) => (
              <span key={k.combustible} className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-xs font-bold">
                <Droplets className="w-3.5 h-3.5 text-[#7ed957]" />
                {k.combustible} · {k.litros} L · ${k.precio.toFixed(2)}/L
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* PASO 1: estación */}
      {!cargando && paso === 1 && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="font-bold text-zinc-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#123d83]" /> Elige la gasolinera
            </h2>
            <Input placeholder="Buscar por nombre o dirección…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <button
              onClick={() => setSoloConStock(!soloConStock)}
              className={`self-start mt-1 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                soloConStock ? 'bg-[#55b949]/15 text-[#3a9e30]' : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              {soloConStock ? '✅ Solo con combustible' : 'Ver todas las estaciones'}
            </button>
          </CardHeader>
          <CardContent className="max-h-[420px] overflow-y-auto space-y-3">
            {estacionesFiltradas.length === 0 && (
              <p className="text-sm text-zinc-400 text-center py-6">
                {soloConStock ? 'Ninguna estación coincide con stock disponible' : 'Sin resultados'}
              </p>
            )}
            {[...estacionesFiltradas]
              .sort((a, b) => combustiblesEn(b.servicenterId).length - combustiblesEn(a.servicenterId).length)
              .map((e) => {
                const disp = combustiblesEn(e.servicenterId);
                return (
                  <button
                    key={e.servicenterId}
                    onClick={() => { if (disp.length) { setEstacion(e); setPaso(2); } }}
                    disabled={disp.length === 0}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      disp.length
                        ? 'border-l-4 border-[#55b949] bg-gradient-to-r from-[#55b949]/5 to-transparent border-y border-r border-zinc-200 hover:shadow-md hover:shadow-blue-100 hover:-translate-y-0.5'
                        : 'border border-dashed border-zinc-200 opacity-55 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-zinc-900">{e.servicenterName}</div>
                        <div className="text-sm text-zinc-500">{e.address || 'Cuba'}</div>
                      </div>
                      {disp.length ? (
                        <span className="bg-[#55b949] text-white text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm">
                          DISPONIBLE
                        </span>
                      ) : (
                        <span className="bg-zinc-100 text-zinc-400 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                          SIN STOCK
                        </span>
                      )}
                    </div>
                    {disp.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {disp.map((k) => (
                          <span key={k.typeFuelId} className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-100 shadow-sm px-2.5 py-1 rounded-full">
                            <Droplets className={`w-3.5 h-3.5 ${/diesel/i.test(k.combustible) ? 'text-[#b45309]' : 'text-[#123d83]'}`} />
                            {k.combustible}
                            <span className="text-zinc-400 font-semibold">· {k.litros} L · ${k.precio.toFixed(2)}/L</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {disp.length > 0 && (
                      <span
                        role="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setMapa({ titulo: e.servicenterName, query: `${e.servicenterName} ${e.address || 'Cuba'}` });
                        }}
                        className="text-xs text-[#123d83] font-bold mt-2.5 inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        📍 Ver ubicación en el mapa
                      </span>
                    )}
                  </button>
                );
              })}
          </CardContent>
        </Card>
      )}

      {/* PASO 2: tipo + litros */}
      {paso === 2 && (
        <Card>
          <CardHeader>
            <h2 className="font-bold text-zinc-900 flex items-center gap-2"><Droplets className="w-4 h-4 text-[#123d83]" /> {estacion?.servicenterName}</h2>
            <p className="text-xs text-zinc-400">{estacion?.address}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {tipos.map((t) => {
                const k = estacion ? precioDe(estacion.servicenterId, t.typeFuelId) : undefined;
                return (
                  <button
                    key={t.typeFuelId}
                    onClick={() => k && setTipo(t)}
                    disabled={!k}
                    className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all text-left ${
                      tipo?.typeFuelId === t.typeFuelId
                        ? 'border-[#123d83] bg-blue-50 text-[#123d83]'
                        : k
                          ? 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                          : 'border-zinc-100 text-zinc-300 cursor-not-allowed'
                    }`}
                  >
                    {t.typeFuelName}
                    {k && (
                      <span className="block text-[11px] font-normal text-[#3a9e30]">
                        ${k.precio.toFixed(2)}/litro · {k.litros} L disp.
                      </span>
                    )}
                    {!k && <span className="block text-[11px] font-normal">Sin stock aquí</span>}
                  </button>
                );
              })}
            </div>
            <Input label="Litros" type="number" min="1" step="1" value={litros} onChange={(e) => setLitros(e.target.value)} placeholder="Ej: 40" />
            <Button className="w-full bg-[#123d83] hover:bg-[#071a46]" disabled={!tipo || !litros || parseFloat(litros) <= 0} onClick={() => setPaso(3)}>
              Continuar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PASO 3: beneficiario */}
      {paso === 3 && (
        <Card>
          <CardHeader>
            <h2 className="font-bold text-zinc-900 flex items-center gap-2"><User className="w-4 h-4 text-[#123d83]" /> Datos de quien carga en Cuba</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-3 text-sm text-zinc-600">
              {tipo?.typeFuelName} · <b>{litros} litros</b> · {estacion?.servicenterName}
            </div>

            <div className="border-t border-zinc-100 pt-4">
              <p className="text-xs font-black text-[#123d83] uppercase tracking-wide mb-3">👤 1. Quien paga (tú, desde USA)</p>
              <div className="space-y-3">
                <Input label="Tu nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellidos del que paga" />
                <Input label="Tu teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono de contacto en USA" />
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4">
              <p className="text-xs font-black text-[#b45309] uppercase tracking-wide mb-1">⛽ 2. Quien carga en Cuba (beneficiario)</p>
              <p className="text-xs text-zinc-400 mb-3">Se valida el <b>carnet + PIN</b> en el surtidor: el nombre debe ser EXACTAMENTE como aparece en el carnet de identidad.</p>
              <div className="space-y-3">
                <Input label="Nombre EXACTO como en el carnet" value={nombreBeneficiario} onChange={(e) => setNombreBeneficiario(e.target.value)} placeholder="Ej: EVELYN DOMINGUEZ GAITAN" />
                <Input label="Número de carnet (CI)" value={ci} onChange={(e) => setCi(e.target.value.replace(/[^0-9A-Za-z]/g, ''))} placeholder="Ej: 85073109694 (11 dígitos)" />
                <Input label="Teléfono del beneficiario en Cuba" value={telefonoBeneficiario} onChange={(e) => setTelefonoBeneficiario(e.target.value)} placeholder="5XXXXXXXX (para enviarle el PIN)" />
              </div>
            </div>
            <div className="bg-[#071a46] rounded-xl p-4 text-white">
              <div className="flex justify-between text-sm text-white/70">
                <span>{tipo?.typeFuelName} · precio por litro ${((precioDe(estacion?.servicenterId || 0, tipo?.typeFuelId || 0)?.precio) ?? 0).toFixed(2)}/L</span>
                <span>{litros} L</span>
              </div>
              <div className="flex justify-between items-end mt-1">
                <span className="text-xs text-white/50 uppercase tracking-widest">Total a pagar</span>
                <span className="text-3xl font-black font-mono text-[#7ed957]">${totalAuto.toFixed(2)}</span>
              </div>
            </div>
            <Button className="w-full bg-[#55b949] hover:bg-[#348f39] text-white font-bold" disabled={enviando || nombre.length < 3 || nombreBeneficiario.length < 5 || ci.length < 8 || telefono.length < 5 || telefonoBeneficiario.length < 5 || !montoPagado || parseFloat(montoPagado) <= 0} onClick={enviar}>
              {enviando ? 'Enviando solicitud…' : `⚡ Solicitar — ${litros} litros de ${tipo?.typeFuelName}`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PASO 4: SOLICITUD CREADA — pagar por Zelle */}
      {paso === 4 && solicitud && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="border-2 border-[#123d83]">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-[#123d83]" />
              </div>
              <h2 className="text-xl font-black text-zinc-900">Solicitud {solicitud.numero}</h2>
              <p className="text-sm text-zinc-500 mb-6">
                {tipo?.typeFuelName} · {litros} litros · {estacion?.servicenterName}
              </p>

              <div className="bg-gradient-to-br from-[#071a46] to-[#123d83] rounded-2xl p-6 mb-4">
                <p className="text-xs text-white/60 uppercase tracking-widest mb-1">Paga por Zelle</p>
                <p className="text-3xl font-black text-white font-mono">{solicitud.zelle}</p>
                <p className="text-2xl font-black text-[#7ed957] mt-2">
                  ${solicitud.montoUsd.toFixed(2)} USD
                </p>
              </div>

              <p className="text-sm text-zinc-600 mb-2">
                <b>Importante:</b> usa la referencia <b className="font-mono">{solicitud.numero}</b> en tu pago.
              </p>
              <p className="text-sm text-zinc-500 mb-6">
                Al confirmar tu pago te enviaremos el <b>PIN de carga</b> por WhatsApp.
              </p>

              <Button variant="outline" onClick={() => { setPaso(1); setSolicitud(null); setLitros(''); setTipo(null); setEstacion(null); setMontoPagado(''); setNombreBeneficiario(''); setTelefonoBeneficiario(''); }}>
                Nueva solicitud
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* PASO 4b: orden directa (uso futuro) */}
      {paso === 4 && !solicitud && resultado?.data && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="border-2 border-[#55b949]">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#55b949]/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[#3a9e30]" />
              </div>
              <h2 className="text-xl font-black text-zinc-900">¡Orden registrada!</h2>
              <p className="text-sm text-zinc-500 mb-6">Transacción #{resultado.data.transactionId}</p>

              <div className="bg-gradient-to-br from-[#071a46] to-[#123d83] rounded-2xl p-6 mb-6">
                <p className="text-xs text-white/60 uppercase tracking-widest mb-2">Tu PIN de carga</p>
                <p className="text-4xl font-black font-mono text-white tracking-[0.2em]">{resultado.data.pin}</p>
                <button onClick={copiarPin} className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#7ed957] font-semibold hover:underline">
                  {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiado ? '¡Copiado!' : 'Copiar PIN'}
                </button>
              </div>

              <div className="text-sm text-zinc-500 space-y-1 mb-6">
                <p><b>{tipo?.typeFuelName}</b> · {litros} litros</p>
                <p>{estacion?.servicenterName}</p>
                {resultado.data.expirationDate && (
                  <p>Válida hasta: {new Date(resultado.data.expirationDate).toLocaleString('es-ES')}</p>
                )}
              </div>

              <Button variant="outline" onClick={() => { setPaso(1); setResultado(null); setLitros(''); setTipo(null); setEstacion(null); }}>
                Nueva orden
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
      {/* ═══ MAPA DENTRO DE LA WEB (sin salir de la tienda) ═══ */}
      <Dialog open={!!mapa} onOpenChange={(v) => !v && setMapa(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-left">
              <MapPin className="w-4 h-4 text-[#123d83]" /> {mapa?.titulo}
            </DialogTitle>
          </DialogHeader>
          {mapa && (
            <iframe
              title={`Mapa ${mapa.titulo}`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(mapa.query)}&z=15&output=embed`}
              className="w-full h-[380px] rounded-xl border border-zinc-100"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setMapa(null)}
              className="bg-[#123d83] hover:bg-[#071a46] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              ← Volver a la tienda
            </button>
            {mapa && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapa.query)}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-zinc-400 hover:text-zinc-600 font-semibold"
              >
                Abrir en la app de Mapas ↗
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
