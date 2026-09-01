'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Package,
  Sun,
  Search,
  MapPin,
  Phone,
  Calculator,
  Truck,
  ChevronRight,
  Weight,
  DollarSign,
  Sparkles,
  UserCircle,
} from 'lucide-react';
import { calcularEnvio, type EnvioTipo } from '@/lib/leisure-exporting';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export function Home() {
  const { setCurrentView, goToNuevoPedido, currentUser, setShowRegisterDialog } = useAppStore();
  const [calcPeso, setCalcPeso] = useState('');
  const [calcTipo, setCalcTipo] = useState<EnvioTipo>('equipo');
  const [config, setConfig] = useState({
    nombre_negocio: 'Leisure Exporting',
    direccion: '2234 A Winter Woods Blvd, Winter Park, Unit 1000, FL 32792',
    telefono1: '786-942-6904',
    nombre_contacto1: 'Geo',
    telefono2: '786-784-6421',
    nombre_contacto2: 'Adriana',
    telefono3: '',
    nombre_contacto3: '',
    email: '',
    horario: '',
    whatsapp: '',
    instagram: '',
    facebook: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/config');
        const json = await res.json();
        if (json.ok) setConfig((prev) => ({ ...prev, ...json.data }));
      } catch { /* use defaults */ }
    }
    load();

    function onConfigUpdated() {
      load();
    }
    window.addEventListener('config-updated', onConfigUpdated);
    return () => window.removeEventListener('config-updated', onConfigUpdated);
  }, []);

  const calcResult = useMemo(() => {
    const peso = parseFloat(calcPeso);
    if (!peso || peso <= 0) return null;
    return calcularEnvio(peso, calcTipo);
  }, [calcPeso, calcTipo]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        {/* VW Combi background - subtle and nice */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none select-none">
          <img
            src="/background-combi.png"
            alt=""
            className="w-full max-w-2xl object-contain"
            style={{ filter: 'grayscale(30%)' }}
          />
        </div>
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-10 left-10 w-72 h-72 bg-orange-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-orange-50 border border-orange-100 shadow-lg shadow-orange-500/5 mb-6 overflow-hidden">
              <Image src="/logo.png" alt="Leisure Exporting" width={96} height={96} className="object-contain" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 tracking-tight mb-4">
              LEISURE EXPORTING
            </h1>
            <p className="text-lg sm:text-xl text-orange-600 font-semibold tracking-wide mb-2">
              Envíos Internacionales & Sistemas Solares
            </p>
            <p className="text-zinc-500 max-w-2xl mx-auto text-sm sm:text-base mb-8">
              Tu empresa de logística confiable entre Estados Unidos y Latinoamérica. 
              Enviamos paquetes, bicicletas, electrodomésticos y ofrecemos soluciones de energía solar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => goToNuevoPedido()}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 shadow-lg shadow-orange-500/20"
              >
                <Package className="h-5 w-5 mr-2" />
                Hacer un Envío
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setCurrentView('rastreador')}
                className="border-orange-200 text-orange-700 hover:bg-orange-50 px-8"
              >
                <Search className="h-5 w-5 mr-2" />
                Rastrear Paquete
              </Button>
            </div>

            {/* User registration prompt */}
            {!currentUser && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="mt-6"
              >
                <button
                  onClick={() => setShowRegisterDialog(true)}
                  className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-orange-600 transition-colors"
                >
                  <UserCircle className="h-4 w-4" />
                  ¿Primera vez? Regístrate para un mejor servicio
                </button>
              </motion.div>
            )}
            {currentUser && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-sm text-zinc-500"
              >
                Bienvenido, {currentUser.nombre}
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-10">
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
        >
          <motion.div variants={fadeIn}>
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border border-zinc-100 shadow-sm bg-white"
              onClick={() => setCurrentView('tienda')}
            >
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-2">
                  <Truck className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle className="text-lg text-zinc-900">Envíos Internacionales</CardTitle>
                <CardDescription className="text-sm text-zinc-500">
                  Desde $1.80/libra. Recogemos en tu casa o trae a nuestra oficina.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-orange-600 text-sm font-medium">
                  Ver precios <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeIn}>
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border border-zinc-100 shadow-sm bg-white"
              onClick={() => setCurrentView('tienda')}
            >
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                  <Sun className="h-6 w-6 text-amber-500" />
                </div>
                <CardTitle className="text-lg text-zinc-900">Sistemas Solares</CardTitle>
                <CardDescription className="text-sm text-zinc-500">
                  Asesoría y productos EcoFlow para energía solar.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-amber-600 text-sm font-medium">
                  Más información <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeIn}>
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border border-zinc-100 shadow-sm bg-white"
              onClick={() => setCurrentView('rastreador')}
            >
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
                  <Search className="h-6 w-6 text-emerald-500" />
                </div>
                <CardTitle className="text-lg text-zinc-900">Rastreo de Paquetes</CardTitle>
                <CardDescription className="text-sm text-zinc-500">
                  Busca por número CPK, carnet del destinatario o de un familiar.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-emerald-600 text-sm font-medium">
                  Rastrear ahora <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Quick Calculator */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border border-zinc-100 shadow-md overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <Calculator className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">Calculadora de Envío</h2>
                  <p className="text-orange-100 text-sm">Calcula el costo de tu envío al instante</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">
                    Peso (libras)
                  </label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
                    <Input
                      type="number"
                      placeholder="Ej: 10"
                      value={calcPeso}
                      onChange={(e) => setCalcPeso(e.target.value)}
                      className="pl-10 border-orange-200 focus:border-orange-400"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">
                    Tipo de envío
                  </label>
                  <div className="flex gap-2">
                    {([
                      { value: 'equipo' as EnvioTipo, label: 'Equipo' },
                      { value: 'recogida' as EnvioTipo, label: 'Recogida' },
                      { value: 'tiktok' as EnvioTipo, label: 'TikTok' },
                    ]).map((opt) => (
                      <Button
                        key={opt.value}
                        variant={calcTipo === opt.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCalcTipo(opt.value)}
                        className={calcTipo === opt.value
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0'
                          : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                        }
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {calcResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-50 border border-orange-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-900">Resultado del Cálculo</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-zinc-500">Precio/lb:</span>
                      <p className="font-semibold">${calcResult.precioPorLibra.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Subtotal:</span>
                      <p className="font-semibold">${calcResult.subtotal.toFixed(2)}</p>
                    </div>
                    {calcResult.cargoEquipo > 0 && (
                      <div>
                        <span className="text-zinc-500">Cargo equipo:</span>
                        <p className="font-semibold">${calcResult.cargoEquipo.toFixed(2)}</p>
                      </div>
                    )}
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-zinc-500">Total:</span>
                      <p className="text-xl font-bold text-orange-600">${calcResult.total.toFixed(2)}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* AI Chat Promo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card
            className="border border-zinc-100 shadow-md bg-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setCurrentView('chat')}
          >
            <CardContent className="p-6 sm:p-8 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/10">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-zinc-900 mb-1">Asistente Virtual Inteligente</h2>
                <p className="text-zinc-600 text-sm">
                  Pregúntame sobre precios, rastreo, horarios o cualquier duda. Estoy entrenado para ayudarte con todo lo de Leisure Exporting.
                </p>
              </div>
              <ChevronRight className="h-6 w-6 text-orange-400 shrink-0" />
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Contact Info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="border border-zinc-100 shadow-md bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-900">
                <MapPin className="h-5 w-5 text-orange-500" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-orange-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Oficina</p>
                    <p className="text-sm text-zinc-500">{config.direccion}</p>
                    {config.horario && <p className="text-sm text-zinc-500 mt-1">{config.horario}</p>}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-orange-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Teléfonos</p>
                    {config.telefono1 && (
                      <p className="text-sm text-zinc-500">
                        {config.nombre_contacto1 ? `${config.nombre_contacto1}: ` : ''}
                        <a href={`tel:${config.telefono1.replace(/\D/g, '')}`} className="text-orange-600 hover:underline">{config.telefono1}</a>
                      </p>
                    )}
                    {config.telefono2 && (
                      <p className="text-sm text-zinc-500">
                        {config.nombre_contacto2 ? `${config.nombre_contacto2}: ` : ''}
                        <a href={`tel:${config.telefono2.replace(/\D/g, '')}`} className="text-orange-600 hover:underline">{config.telefono2}</a>
                      </p>
                    )}
                    {config.telefono3 && (
                      <p className="text-sm text-zinc-500">
                        {config.nombre_contacto3 ? `${config.nombre_contacto3}: ` : ''}
                        <a href={`tel:${config.telefono3.replace(/\D/g, '')}`} className="text-orange-600 hover:underline">{config.telefono3}</a>
                      </p>
                    )}
                    {config.whatsapp && (
                      <p className="text-sm text-zinc-500 mt-1">
                        WhatsApp: <a href={`https://wa.me/${config.whatsapp.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{config.whatsapp}</a>
                      </p>
                    )}
                    {config.email && (
                      <p className="text-sm text-zinc-500 mt-1">
                        Email: <a href={`mailto:${config.email}`} className="text-orange-600 hover:underline">{config.email}</a>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Mobile Bottom Spacer */}
      <div className="md:hidden h-20" />
    </div>
  );
}
