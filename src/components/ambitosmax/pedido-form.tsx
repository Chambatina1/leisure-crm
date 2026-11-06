'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { useCartStore } from './cart-store';
import { esBalitaGas, quedanEnPunto, type PuntoRecogida } from '@/lib/puntos-gas';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Loader2, ShoppingCart, MapPin, Banknote, CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { AceptarReferencia } from './aceptar-referencia';

interface PedidoData {
  nombreComprador: string;
  emailComprador: string;
  telefonoComprador: string;
  nombreDestinatario: string;
  telefonoDestinatario: string;
  carnetDestinatario: string;
  direccionDestinatario: string;
  producto: string;
  notas: string;
}

const defaultData: PedidoData = {
  nombreComprador: '',
  emailComprador: '',
  telefonoComprador: '',
  nombreDestinatario: '',
  telefonoDestinatario: '',
  carnetDestinatario: '',
  direccionDestinatario: '',
  producto: '',
  notas: '',
};

const AMBITOSMAX_ADDRESS = '6800 N Florida Ave, Tampa, FL 33604';
// Líneas a cobrar por Zelle: todo el carrito si el producto elegido está en él,
// o solo ese producto si se compró directamente.
interface LineaCarrito { id: number; nombre: string; precio: number; qty: number }
function lineasDeCompra(producto: { id?: number; nombre: string; precio: number } | null): LineaCarrito[] {
  if (!producto?.id) return [];
  const cart = useCartStore.getState().items;
  if (cart.some((i) => i.product.id === producto.id)) {
    return cart.map((i) => ({ id: i.product.id, nombre: i.product.nombre, precio: i.product.precio, qty: i.qty }));
  }
  return [{ id: producto.id, nombre: producto.nombre, precio: producto.precio, qty: 1 }];
}

export function PedidoForm() {
  const { selectedPedidoId, selectedProduct, setAdminView, adminView, mode, setCurrentView, setSelectedProduct } = useAppStore();
  const isEdit = mode === 'admin' && adminView === 'pedido-edit';
  const isPublic = mode === 'public';
  const [data, setData] = useState<PedidoData>(defaultData);
  const [errors, setErrors] = useState<Partial<Record<keyof PedidoData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lineas, setLineas] = useState<LineaCarrito[]>([]);
  const pagaConZelle = isPublic && !isEdit && lineas.length > 0;
  const [pagoZelle, setPagoZelle] = useState<PagoZelle | null>(null);
  const totalCarrito = lineas.reduce((s, l) => s + l.precio * l.qty, 0);
  // Las balitas de gas se recogen en uno de los dos puntos: hay que elegirlo
  const llevaGas = pagaConZelle && lineas.some((l) => esBalitaGas(l.nombre));
  const nBalitas = lineas.filter((l) => esBalitaGas(l.nombre)).reduce((s, l) => s + l.qty, 0);
  const [punto, setPunto] = useState<string | null>(null);
  const [errorPunto, setErrorPunto] = useState(false);
  const [puntos, setPuntos] = useState<PuntoRecogida[]>([]);
  // Los puntos los define el administrador en Tienda → Puntos de recogida
  useEffect(() => {
    if (!llevaGas) return;
    fetch('/api/tienda/puntos')
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return;
        setPuntos(j.data);
        const conBalitas = (j.data as PuntoRecogida[]).filter((p) => (quedanEnPunto(p) ?? Infinity) > 0);
        if (conBalitas.length === 1) setPunto(conBalitas[0].id);
      })
      .catch(() => toast.error('No se pudieron cargar los puntos de recogida'));
  }, [llevaGas]);

  useEffect(() => {
    if (isEdit && selectedPedidoId) {
      setLoading(true);
      fetch(`/api/pedidos/${selectedPedidoId}`)
        .then(res => res.json())
        .then(json => {
          if (json.ok) {
            const p = json.data;
            setData({
              nombreComprador: p.nombreComprador || '',
              emailComprador: p.emailComprador || '',
              telefonoComprador: p.telefonoComprador || '',
              nombreDestinatario: p.nombreDestinatario || '',
              telefonoDestinatario: p.telefonoDestinatario || '',
              carnetDestinatario: p.carnetDestinatario || '',
              direccionDestinatario: p.direccionDestinatario || '',
              producto: p.producto || '',
              notas: p.notas || '',
            });
          }
        })
        .catch(() => toast.error('Error al cargar pedido'))
        .finally(() => setLoading(false));
    } else if (selectedProduct) {
      // Pre-fill form with product data from store
      const ls = isPublic ? lineasDeCompra(selectedProduct) : [];
      setLineas(ls);
      setData({
        ...defaultData,
        producto: ls.length > 1
          ? ls.map((l) => `${l.qty}x ${l.nombre}`).join(', ')
          : `${selectedProduct.nombre} - $${selectedProduct.precio.toFixed(2)}`,
        notas: `Enviar equipo a: ${AMBITOSMAX_ADDRESS}`,
      });
    }
  }, [isEdit, isPublic, selectedPedidoId, selectedProduct]);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof PedidoData, string>> = {};
    if (!data.nombreComprador.trim()) errs.nombreComprador = 'Requerido';
    if (data.emailComprador && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailComprador)) errs.emailComprador = 'Email inválido';
    if (!data.telefonoComprador.trim()) errs.telefonoComprador = 'Requerido';
    if (!data.nombreDestinatario.trim()) errs.nombreDestinatario = 'Requerido';
    if (!data.telefonoDestinatario.trim()) errs.telefonoDestinatario = 'Requerido';
    if (!data.direccionDestinatario.trim()) errs.direccionDestinatario = 'Requerido';
    if (!data.producto.trim()) errs.producto = 'Requerido';
    if (llevaGas && !/^\d{11}$/.test(data.carnetDestinatario.replace(/\s/g, ''))) {
      errs.carnetDestinatario = 'Carnet de quien recoge: 11 dígitos';
    }
    setErrors(errs);
    const faltaPunto = llevaGas && !punto;
    setErrorPunto(faltaPunto);
    if (faltaPunto) toast.error('Elige dónde vas a recoger la balita de gas');
    return Object.keys(errs).length === 0 && !faltaPunto;
  };

  // Pago por Zelle: el servidor crea la compra y devuelve la referencia que
  // el cliente escribe en la nota del Zelle. Las balitas se confirman solas.
  const pagarConZelle = async () => {
    const res = await fetch('/api/tienda/zelle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        items: lineas.map((l) => ({ id: l.id, qty: l.qty })),
        ...(llevaGas && punto ? { puntoRecogida: punto } : {}),
      }),
    });
    const json = await res.json();
    if (!json.ok && json.requiereRegistro) {
      useAppStore.getState().pedirRegistro({ tipo: 'pedido' });
      return;
    }
    if (json.ok) {
      useCartStore.getState().clear();
      setPagoZelle(json.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (json.faltaPunto) setErrorPunto(true);
    if (json.error && typeof json.error === 'object') {
      setErrors(Object.fromEntries(Object.entries(json.error).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
      toast.error('Revisa los datos marcados');
    } else toast.error(json.error || 'No se pudo crear la compra');
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (pagaConZelle) return await pagarConZelle();
      const url = isEdit ? `/api/pedidos/${selectedPedidoId}` : '/api/pedidos';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.ok && json.requiereRegistro) {
        useAppStore.getState().pedirRegistro({ tipo: 'pedido' });
        return;
      }
      if (json.ok) {
        toast.success(isEdit ? 'Pedido actualizado' : 'Pedido creado correctamente');
        setSelectedProduct(null);
        if (isPublic) {
          setCurrentView('home');
        } else {
          setAdminView('pedidos');
        }
      } else {
        if (json.error && typeof json.error === 'object') {
          setErrors(json.error);
        } else {
          toast.error(json.error || 'Error al guardar');
        }
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedProduct(null);
    if (isPublic) setCurrentView('home');
    else setAdminView('pedidos');
  };

  const updateField = (field: keyof PedidoData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  if (pagoZelle) return <ResultadoZelle pago={pagoZelle} onVolver={() => { setPagoZelle(null); setSelectedProduct(null); setCurrentView('home'); }} />;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-zinc-900">
            {isEdit ? `Editar Pedido #${selectedPedidoId}` : 'Nuevo Envío'}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {isEdit ? 'Modifica los datos del pedido' : 'Completa el formulario para crear un nuevo envío'}
          </p>
        </div>
        {selectedProduct && !isEdit && (
          <Badge className="bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
            <ShoppingCart className="h-3 w-3 mr-1" />
            Comprando: {selectedProduct.nombre}
          </Badge>
        )}
      </div>

      {/* Product info banner when buying from store */}
      {selectedProduct && !isEdit && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-200">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <ShoppingCart className="h-5 w-5 text-[#123d83]" />
              </div>
              <div className="flex-1 min-w-0">
                {lineas.length > 1 ? (
                  <ul className="space-y-0.5">
                    {lineas.map((l) => (
                      <li key={l.id} className="text-sm text-[#071a46] flex justify-between gap-3">
                        <span>{l.qty}x {l.nombre}</span>
                        <span className="font-semibold">${(l.precio * l.qty).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-semibold text-[#071a46] text-sm">{selectedProduct.nombre}</p>
                )}
                <p className="text-blue-700 text-sm font-bold">
                  {lineas.length > 1 ? 'Total: ' : ''}${(lineas.length ? totalCarrito : selectedProduct.precio).toFixed(2)}
                </p>
                <div className="flex items-start gap-1.5 mt-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-[#123d83] leading-relaxed">
                    Enviar equipo a: {AMBITOSMAX_ADDRESS}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          {/* Datos del Comprador */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-bold text-[#123d83]">1</span>
              </div>
              Datos del Comprador
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombreComprador">Nombre completo *</Label>
                <Input
                  id="nombreComprador"
                  value={data.nombreComprador}
                  onChange={(e) => updateField('nombreComprador', e.target.value)}
                  placeholder="Nombre del comprador"
                  className={errors.nombreComprador ? 'border-red-500' : ''}
                />
                {errors.nombreComprador && <p className="text-xs text-red-500 mt-1">{errors.nombreComprador}</p>}
              </div>
              <div>
                <Label htmlFor="emailComprador">Email</Label>
                <Input
                  id="emailComprador"
                  type="email"
                  value={data.emailComprador}
                  onChange={(e) => updateField('emailComprador', e.target.value)}
                  placeholder="email@ejemplo.com"
                  className={errors.emailComprador ? 'border-red-500' : ''}
                />
                {errors.emailComprador && <p className="text-xs text-red-500 mt-1">{errors.emailComprador}</p>}
              </div>
              <div>
                <Label htmlFor="telefonoComprador">Teléfono *</Label>
                <Input
                  id="telefonoComprador"
                  value={data.telefonoComprador}
                  onChange={(e) => updateField('telefonoComprador', e.target.value)}
                  placeholder="786-000-0000"
                  className={errors.telefonoComprador ? 'border-red-500' : ''}
                />
                {errors.telefonoComprador && <p className="text-xs text-red-500 mt-1">{errors.telefonoComprador}</p>}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Datos del Destinatario */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-bold text-[#123d83]">2</span>
              </div>
              Datos del Destinatario
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombreDestinatario">Nombre completo *</Label>
                <Input
                  id="nombreDestinatario"
                  value={data.nombreDestinatario}
                  onChange={(e) => updateField('nombreDestinatario', e.target.value)}
                  placeholder="Nombre del destinatario"
                  className={errors.nombreDestinatario ? 'border-red-500' : ''}
                />
                {errors.nombreDestinatario && <p className="text-xs text-red-500 mt-1">{errors.nombreDestinatario}</p>}
              </div>
              <div>
                <Label htmlFor="telefonoDestinatario">Teléfono *</Label>
                <Input
                  id="telefonoDestinatario"
                  value={data.telefonoDestinatario}
                  onChange={(e) => updateField('telefonoDestinatario', e.target.value)}
                  placeholder="53-000-0000"
                  className={errors.telefonoDestinatario ? 'border-red-500' : ''}
                />
                {errors.telefonoDestinatario && <p className="text-xs text-red-500 mt-1">{errors.telefonoDestinatario}</p>}
              </div>
              <div>
                <Label htmlFor="carnetDestinatario">{llevaGas ? 'Carnet de quien recoge la balita *' : 'Carnet de identidad'}</Label>
                <Input
                  id="carnetDestinatario"
                  value={data.carnetDestinatario}
                  onChange={(e) => updateField('carnetDestinatario', e.target.value)}
                  placeholder={llevaGas ? '11 dígitos' : 'Número de carnet'}
                  inputMode={llevaGas ? 'numeric' : undefined}
                  className={errors.carnetDestinatario ? 'border-red-500' : ''}
                />
                {errors.carnetDestinatario && <p className="text-xs text-red-500 mt-1">{errors.carnetDestinatario}</p>}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="direccionDestinatario">Dirección completa *</Label>
                <Input
                  id="direccionDestinatario"
                  value={data.direccionDestinatario}
                  onChange={(e) => updateField('direccionDestinatario', e.target.value)}
                  placeholder="Calle, municipio, provincia"
                  className={errors.direccionDestinatario ? 'border-red-500' : ''}
                />
                {errors.direccionDestinatario && <p className="text-xs text-red-500 mt-1">{errors.direccionDestinatario}</p>}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Producto */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-bold text-[#123d83]">3</span>
              </div>
              Detalles del Envío
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="producto">Producto / Descripción del paquete *</Label>
                <Input
                  id="producto"
                  value={data.producto}
                  onChange={(e) => updateField('producto', e.target.value)}
                  placeholder="Ej: Ropa, zapatos, alimentos..."
                  className={errors.producto ? 'border-red-500' : ''}
                />
                {errors.producto && <p className="text-xs text-red-500 mt-1">{errors.producto}</p>}
              </div>
              <div>
                <Label htmlFor="notas">Notas adicionales</Label>
                <Textarea
                  id="notas"
                  value={data.notas}
                  onChange={(e) => updateField('notas', e.target.value)}
                  placeholder="Instrucciones especiales, fragilidad, etc."
                  rows={3}
                />
                {selectedProduct && !isEdit && (
                  <p className="text-xs text-[#123d83] mt-1.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    La dirección de Ambitosmax se incluye automáticamente como nota de envío
                  </p>
                )}
              </div>
            </div>
          </div>

          {llevaGas && (
            <>
              <Separator className="my-6" />
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-zinc-900 mb-1 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-emerald-700" />
                  </div>
                  ¿Dónde recoges la balita de gas? *
                </h2>
                <p className="text-sm text-zinc-500 mb-1">Las balitas solo están en estos puntos. Marca el punto donde quieres comprarla.</p>
                <p className="text-sm font-semibold text-amber-700 mb-3">Se recoge al día siguiente del pago. Lo que se compra el viernes se entrega el lunes.</p>
                <div role="radiogroup" aria-label="Punto de recogida" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {puntos.map((pt) => {
                    const { id: k, nombre, lugar } = pt;
                    const sel = punto === k;
                    const quedan = quedanEnPunto(pt);
                    const agotado = quedan !== null && quedan <= 0;
                    const pocas = quedan !== null && quedan > 0 && quedan < nBalitas;
                    return (
                      <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={sel}
                        disabled={agotado}
                        onClick={() => { setPunto(k); setErrorPunto(false); }}
                        className={`text-left rounded-xl border-2 p-4 flex items-start gap-3 transition-colors ${
                          agotado ? 'border-zinc-200 bg-zinc-50 opacity-60 cursor-not-allowed'
                          : sel ? 'border-[#55b949] bg-emerald-50' : errorPunto ? 'border-red-400 bg-red-50/40' : 'border-zinc-200 hover:border-emerald-300'
                        }`}
                      >
                        <span className={`mt-0.5 h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center ${sel ? 'border-[#55b949]' : 'border-zinc-300'}`}>
                          {sel && <span className="h-2.5 w-2.5 rounded-full bg-[#55b949]" />}
                        </span>
                        <span>
                          <span className="block font-semibold text-zinc-900">{nombre}</span>
                          {lugar && <span className="block text-sm text-zinc-600">{lugar}</span>}
                          {quedan !== null && (
                            <span className={`block text-sm font-semibold mt-1 ${agotado ? 'text-red-600' : pocas ? 'text-amber-600' : 'text-emerald-700'}`}>
                              {agotado ? 'Agotado en este punto' : `${quedan} ${quedan === 1 ? 'disponible' : 'disponibles'}${pocas ? ` (pides ${nBalitas})` : ''}`}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errorPunto && <p className="text-xs text-red-500 mt-2">Elige uno de los puntos de recogida</p>}
              </div>
            </>
          )}

          {pagaConZelle && (
            <p className="text-sm text-zinc-600 rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2 mt-4">
              Al continuar te damos el correo de Zelle, el monto y una referencia. El pago lo haces desde la app de tu banco.
            </p>
          )}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-[#123d83] hover:bg-[#071a46] text-white flex-1 sm:flex-none"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : pagaConZelle ? (
                <Banknote className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEdit ? 'Actualizar Pedido' : pagaConZelle ? `Pagar $${totalCarrito.toFixed(2)} por Zelle` : 'Crear Pedido'}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="md:hidden h-20" />
    </motion.div>
  );
}


interface PagoZelle {
  tipo: 'balitas' | 'pedido';
  referencia: string;
  montoUsd: number;
  zelle: string;
  puntoRecogida?: string;
  resumen: string;
  despuesDelCierre?: boolean;
  recogida?: string;
}

function Dato({ etiqueta, valor, copiar }: { etiqueta: string; valor: string; copiar?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-white border border-zinc-200 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{etiqueta}</p>
        <p className="font-semibold text-zinc-900 [overflow-wrap:anywhere]">{valor}</p>
      </div>
      {copiar && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Copiar ${etiqueta}`}
          onClick={() => copiarTexto(valor)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

const copiarTexto = (texto: string, aviso = 'Copiado') =>
  navigator.clipboard?.writeText(texto).then(() => toast.success(aviso), () => toast.error('No se pudo copiar'));

function Paso({ n, titulo, children }: { n: number; titulo: string; children?: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="h-7 w-7 shrink-0 rounded-full bg-[#123d83] text-white text-sm font-bold flex items-center justify-center">{n}</span>
      <div className="min-w-0 flex-1 space-y-2 pt-0.5">
        <p className="font-semibold text-zinc-900">{titulo}</p>
        {children}
      </div>
    </li>
  );
}

function ResultadoZelle({ pago, onVolver }: { pago: PagoZelle; onVolver: () => void }) {
  const balitas = pago.tipo === 'balitas';
  const monto = `$${pago.montoUsd.toFixed(2)}`;
  const todo = `Zelle a: ${pago.zelle}\nMonto: ${monto}\nNota (memo): ${pago.referencia}`;
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <Card className="border-emerald-200">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-[#55b949] shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-zinc-900">Tu compra está reservada. Ahora paga por Zelle</h1>
              <p className="text-sm text-zinc-600">{pago.resumen}</p>
            </div>
          </div>

          <AceptarReferencia referencia={pago.referencia}>
          <p className="text-sm text-zinc-700 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            Zelle se paga desde la app de tu banco (o la app Zelle). Deja esta página abierta, sigue estos pasos y vuelve si necesitas copiar algo.
          </p>

          <ol className="space-y-4">
            <Paso n={1} titulo="Abre la app de tu banco y entra en Zelle">
              <p className="text-sm text-zinc-600">Busca &quot;Send money with Zelle&quot; o &quot;Enviar dinero con Zelle&quot;.</p>
            </Paso>
            <Paso n={2} titulo="Pega este correo como destinatario">
              <Dato etiqueta="Enviar a" valor={pago.zelle} copiar />
            </Paso>
            <Paso n={3} titulo="Escribe el monto exacto">
              <Dato etiqueta="Monto" valor={monto} copiar />
            </Paso>
            <Paso n={4} titulo="En la nota (memo) pega tu referencia">
              <Dato etiqueta="Nota / Memo" valor={pago.referencia} copiar />
              <p className="text-xs text-red-600 font-medium">
                Importante: sin esta referencia en la nota no sabemos que el pago es tuyo{balitas ? ' y no recibes el PIN' : ''}.
              </p>
            </Paso>
            <Paso n={5} titulo="Revisa y envía el pago">
              <p className="text-sm text-zinc-600">
                {balitas
                  ? 'Cuando llegue tu pago se confirma solo y te enviamos el PIN de recogida por correo, normalmente en pocos minutos. '
                  : 'Cuando recibamos tu pago confirmamos el pedido y te avisamos.'}
                {balitas && pago.recogida && <> Si pagas hoy, recoges a partir de <b>{pago.recogida}</b>.</>}
              </p>
            </Paso>
          </ol>

          {pago.puntoRecogida && <Dato etiqueta="Recoges en" valor={pago.puntoRecogida} />}

          <div className="grid gap-2">
            <Button variant="outline" onClick={() => copiarTexto(todo, 'Datos de pago copiados')}>
              <Copy className="h-4 w-4 mr-2" /> Copiar todos los datos de pago
            </Button>
            {balitas && (
              <Button variant="outline" onClick={() => useAppStore.getState().setCurrentView('reserva-cilindro')}>
                Ver el estado y el PIN de mi compra
              </Button>
            )}
            <Button onClick={onVolver} className="bg-[#123d83] hover:bg-[#071a46] text-white">Volver a la tienda</Button>
          </div>
          </AceptarReferencia>
        </CardContent>
      </Card>
    </div>
  );
}
