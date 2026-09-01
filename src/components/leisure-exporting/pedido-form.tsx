'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Loader2, ShoppingCart, MapPin } from 'lucide-react';
import { toast } from 'sonner';

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

const LEISURE_ADDRESS = '2234 A Winter Woods Blvd, Winter Park, Unit 1000, FL 32792';

export function PedidoForm() {
  const { selectedPedidoId, selectedProduct, setAdminView, adminView, mode, setCurrentView, setSelectedProduct } = useAppStore();
  const isEdit = mode === 'admin' && adminView === 'pedido-edit';
  const isPublic = mode === 'public';
  const [data, setData] = useState<PedidoData>(defaultData);
  const [errors, setErrors] = useState<Partial<Record<keyof PedidoData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
      setData({
        ...defaultData,
        producto: `${selectedProduct.nombre} - $${selectedProduct.precio.toFixed(2)}`,
        notas: `Enviar equipo a: ${LEISURE_ADDRESS}`,
      });
    }
  }, [isEdit, selectedPedidoId, selectedProduct]);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof PedidoData, string>> = {};
    if (!data.nombreComprador.trim()) errs.nombreComprador = 'Requerido';
    if (data.emailComprador && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailComprador)) errs.emailComprador = 'Email inválido';
    if (!data.telefonoComprador.trim()) errs.telefonoComprador = 'Requerido';
    if (!data.nombreDestinatario.trim()) errs.nombreDestinatario = 'Requerido';
    if (!data.telefonoDestinatario.trim()) errs.telefonoDestinatario = 'Requerido';
    if (!data.direccionDestinatario.trim()) errs.direccionDestinatario = 'Requerido';
    if (!data.producto.trim()) errs.producto = 'Requerido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = isEdit ? `/api/pedidos/${selectedPedidoId}` : '/api/pedidos';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
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
          <Badge className="bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
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
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <ShoppingCart className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-amber-900 text-sm">{selectedProduct.nombre}</p>
                <p className="text-amber-700 text-sm font-bold">${selectedProduct.precio.toFixed(2)}</p>
                <div className="flex items-start gap-1.5 mt-2">
                  <MapPin className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-600 leading-relaxed">
                    Enviar equipo a: {LEISURE_ADDRESS}
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
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <span className="text-sm font-bold text-amber-600">1</span>
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
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <span className="text-sm font-bold text-amber-600">2</span>
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
                <Label htmlFor="carnetDestinatario">Carnet de identidad</Label>
                <Input
                  id="carnetDestinatario"
                  value={data.carnetDestinatario}
                  onChange={(e) => updateField('carnetDestinatario', e.target.value)}
                  placeholder="Número de carnet"
                />
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
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <span className="text-sm font-bold text-amber-600">3</span>
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
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    La dirección de Leisure Exporting se incluye automáticamente como nota de envío
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-white flex-1 sm:flex-none"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEdit ? 'Actualizar Pedido' : 'Crear Pedido'}
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

