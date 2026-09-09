'use client';

// ═══════════════════════════════════════════════════════════════════
// COMBUSTIBLE CUPET — venta de combustible en gasolineras de Cuba
// Flujo: estación → tipo + litros → datos del beneficiario → PIN
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
    ])
      .then(([e, t]) => {
        if (e.ok) setEstaciones(e.data || []);
        else setError(e.error || 'No se pudo cargar las estaciones');
        if (t.ok) setTipos(t.data || []);
      })
      .catch(() => setError('Error de conexión con CUPET'))
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
          montoUsd: parseFloat(montoPagado),
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

  const estacionesFiltradas = estaciones.filter(
    (e) =>
      !busqueda ||
      e.servicenterName.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.address.toLowerCase().includes(busqueda.toLowerCase())
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
            <h1 className="text-2xl font-black text-zinc-900">Combustible CUPET</h1>
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

      {/* PASO 1: estación */}
      {!cargando && paso === 1 && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="font-bold text-zinc-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-[#123d83]" /> Elige la gasolinera</h2>
            <Input placeholder="Buscar por nombre o dirección…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </CardHeader>
          <CardContent className="max-h-[420px] overflow-y-auto space-y-2">
            {estacionesFiltradas.length === 0 && <p className="text-sm text-zinc-400 text-center py-6">Sin resultados</p>}
            {estacionesFiltradas.map((e) => (
              <button
                key={e.servicenterId}
                onClick={() => { setEstacion(e); setPaso(2); }}
                className="w-full text-left p-4 rounded-xl border border-zinc-200 hover:border-[#123d83] hover:bg-blue-50/50 transition-all"
              >
                <div className="font-bold text-zinc-900">{e.servicenterName}</div>
                <div className="text-sm text-zinc-500">{e.address || 'Cuba'}</div>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.servicenterName + ' ' + (e.address || 'Cuba'))}`}
                   target="_blank" rel="noopener noreferrer"
                   className="text-xs text-[#123d83] font-semibold mt-1 inline-flex items-center gap-1 hover:underline">
                  📍 Ver ubicación en el mapa ↗
                </a>
              </button>
            ))}
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
              {tipos.map((t) => (
                <button
                  key={t.typeFuelId}
                  onClick={() => setTipo(t)}
                  className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    tipo?.typeFuelId === t.typeFuelId
                      ? 'border-[#123d83] bg-blue-50 text-[#123d83]'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  {t.typeFuelName}
                </button>
              ))}
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
              <p className="text-xs text-zinc-400 mb-3">CUPET valida el <b>carnet + PIN</b> en el surtidor: el nombre debe ser EXACTAMENTE como aparece en el carnet de identidad.</p>
              <div className="space-y-3">
                <Input label="Nombre EXACTO como en el carnet" value={nombreBeneficiario} onChange={(e) => setNombreBeneficiario(e.target.value)} placeholder="Ej: EVELYN DOMINGUEZ GAITAN" />
                <Input label="Número de carnet (CI)" value={ci} onChange={(e) => setCi(e.target.value.replace(/[^0-9A-Za-z]/g, ''))} placeholder="Ej: 85073109694 (11 dígitos)" />
                <Input label="Teléfono del beneficiario en Cuba" value={telefonoBeneficiario} onChange={(e) => setTelefonoBeneficiario(e.target.value)} placeholder="5XXXXXXXX (para enviarle el PIN)" />
              </div>
            </div>
            <Input label="Monto pagado (USD)" type="number" min="1" step="0.01" value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} placeholder="Ej: 65.00" />
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

              <Button variant="outline" onClick={() => { setPaso(1); setSolicitud(null); setLitros(''); setTipo(null); setEstacion(null); setMontoPagado(''); }}>
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
    </motion.div>
  );
}
