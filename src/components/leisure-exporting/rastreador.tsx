'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Package,
  Loader2,
  FileText,
  Calendar,
  Truck,
  Building,
  CircleDot,
  CheckCircle2,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { ETAPAS } from '@/lib/leisure-exporting';
import { toast } from 'sonner';

interface TrackingResult {
  id: number;
  cpk: string;
  fecha: string | null;
  estado: string;
  descripcion: string | null;
  embarcador: string | null;
  consignatario: string | null;
  carnetPrincipal: string | null;
  rawData: string | null;
  estadoCalculado: string;
  etapaInfo: {
    estado: string;
    descripcion: string;
    color: string;
    diasMin: number;
    diasMax: number;
  };
}

const SEARCH_HINTS = [
  { label: 'Solo número CPK', example: '266228' },
  { label: 'CPK completo', example: 'CPK-0266228' },
  { label: 'Carnet destinatario', example: '88010123456' },
  { label: 'Carnet familiar', example: '90010234567' },
];

export function Rastreador() {
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState<TrackingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchInput.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      // Use smart search - the API will auto-detect CPK vs carnet
      const params = new URLSearchParams({ q: searchInput.trim() });
      const res = await fetch(`/api/tracking/buscar?${params}`);
      const json = await res.json();
      if (json.ok) {
        setResults(json.data);
        if (json.data.length === 0) {
          toast.info('No se encontraron resultados. Intenta con otro número.');
        }
      } else {
        toast.error(json.error || 'Error en la búsqueda');
        setResults([]);
      }
    } catch {
      toast.error('Error de conexión');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchInput]);



  const getStageForEstado = (estado: string) => {
    const index = ETAPAS.findIndex(e => e.estado === estado);
    return index >= 0 ? index : 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Rastreador de Paquetes</h1>
        <p className="text-zinc-500 mt-1">
          Busca por número CPK, solo el número, o carnet de identidad del destinatario o familiar
        </p>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md mb-6 bg-gradient-to-br from-white to-blue-50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
              <Input
                placeholder="Número CPK, carnet de identidad..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 border-blue-200 focus:border-[#123d83]"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-[#55b949] hover:from-[#071a46] hover:to-[#348f39] text-white px-6"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Buscar
            </Button>
          </div>

          {/* Search hints */}
          <div className="flex flex-wrap gap-2 mt-3">
            {SEARCH_HINTS.map((hint) => (
              <button
                key={hint.label}
                onClick={() => { setSearchInput(hint.example); }}
                className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              >
                {hint.label}: {hint.example}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading && (
        <div className="space-y-4 mb-6">
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-blue-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-zinc-700 mb-1">Sin resultados</h3>
            <p className="text-sm text-zinc-400">
              No se encontraron paquetes con ese número. Puedes intentar con:
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="text-xs">Solo los dígitos del CPK</Badge>
              <Badge variant="outline" className="text-xs">Carnet del destinatario</Badge>
              <Badge variant="outline" className="text-xs">Carnet de un familiar</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4 mb-6">
          <p className="text-sm text-zinc-500">{results.length} resultado(s) encontrado(s)</p>
          {results.map((result) => {
            const currentStage = getStageForEstado(result.etapaInfo?.estado || result.estado);
            return (
              <Card key={result.id} className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-blue-50">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        {result.cpk}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {result.consignatario && `Destinatario: ${result.consignatario}`}
                      </CardDescription>
                    </div>
                    <Badge className="text-sm font-medium px-3 py-1" style={{ backgroundColor: result.etapaInfo?.color || '#f59e0b', color: 'white' }}>
                      {result.estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {result.fecha && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-blue-400 shrink-0" />
                        <div>
                          <p className="text-xs text-zinc-400">Fecha</p>
                          <p className="font-medium">{result.fecha}</p>
                        </div>
                      </div>
                    )}
                    {result.embarcador && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-blue-400 shrink-0" />
                        <div>
                          <p className="text-xs text-zinc-400">Embarcador</p>
                          <p className="font-medium text-xs">{result.embarcador}</p>
                        </div>
                      </div>
                    )}
                    {result.carnetPrincipal && (
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-blue-400 shrink-0" />
                        <div>
                          <p className="text-xs text-zinc-400">Carnet</p>
                          <p className="font-mono text-xs">{result.carnetPrincipal}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {result.descripcion && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-6">
                      <p className="text-sm text-zinc-600">
                        <span className="font-medium text-zinc-800">Descripción:</span> {result.descripcion}
                      </p>
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <p className="text-sm font-semibold text-zinc-700 mb-3">Estado del envío</p>
                    <div className="space-y-0">
                      {ETAPAS.map((etapa, idx) => {
                        const isCompleted = idx < currentStage;
                        const isCurrent = idx === currentStage;
                        return (
                          <div key={etapa.estado} className="flex gap-3">
                            {/* Line & dot */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                  isCompleted
                                    ? 'bg-emerald-100'
                                    : isCurrent
                                    ? 'bg-blue-100 ring-2 ring-blue-400'
                                    : 'bg-zinc-100'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : isCurrent ? (
                                  <Truck className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <CircleDot className="h-4 w-4 text-zinc-300" />
                                )}
                              </div>
                              {idx < ETAPAS.length - 1 && (
                                <div className={`w-0.5 h-8 ${isCompleted ? 'bg-emerald-200' : 'bg-zinc-200'}`} />
                              )}
                            </div>
                            {/* Content */}
                            <div className="pb-6">
                              <p className={`text-sm font-medium ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-emerald-700' : 'text-zinc-400'}`}>
                                {etapa.estado}
                              </p>
                              <p className={`text-xs mt-0.5 ${isCurrent ? 'text-blue-600' : 'text-zinc-400'}`}>
                                {etapa.descripcion}
                              </p>
                              <p className="text-[10px] text-zinc-300 mt-0.5">
                                Días {etapa.diasMin}-{etapa.diasMax < 999 ? etapa.diasMax : '+'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="md:hidden h-20" />
    </motion.div>
  );
}
