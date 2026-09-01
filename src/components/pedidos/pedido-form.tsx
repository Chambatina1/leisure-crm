'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { usePedidosStore, type Pedido } from './pedidos-provider';
import { toast } from 'sonner';

const pedidoSchema = z.object({
  nombre_comprador: z.string().min(1, 'El nombre del comprador es requerido'),
  email_comprador: z.string().email('Email no válido').or(z.literal('')).optional().default(''),
  telefono_comprador: z.string().min(1, 'El teléfono del comprador es requerido'),
  nombre_destinatario: z.string().min(1, 'El nombre del destinatario es requerido'),
  telefono_destinatario: z.string().min(1, 'El teléfono del destinatario es requerido'),
  carnet_destinatario: z.string().optional().default(''),
  direccion_destinatario: z.string().min(1, 'La dirección del destinatario es requerida'),
  producto: z.string().min(1, 'El producto es requerido'),
  notas: z.string().optional().default(''),
  estado: z.string().optional().default('pendiente'),
});

type PedidoFormData = z.infer<typeof pedidoSchema>;

interface PedidoFormProps {
  mode: 'create' | 'edit';
}

export function PedidoForm({ mode }: PedidoFormProps) {
  const { selectedPedido, setCurrentView, triggerRefresh } = usePedidosStore();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PedidoFormData>({
    resolver: zodResolver(pedidoSchema),
    defaultValues: mode === 'edit' && selectedPedido
      ? {
          nombre_comprador: selectedPedido.nombre_comprador || '',
          email_comprador: selectedPedido.email_comprador || '',
          telefono_comprador: selectedPedido.telefono_comprador || '',
          nombre_destinatario: selectedPedido.nombre_destinatario || '',
          telefono_destinatario: selectedPedido.telefono_destinatario || '',
          carnet_destinatario: selectedPedido.carnet_destinatario || '',
          direccion_destinatario: selectedPedido.direccion_destinatario || '',
          producto: selectedPedido.producto || '',
          notas: selectedPedido.notas || '',
          estado: selectedPedido.estado || 'pendiente',
        }
      : {
          nombre_comprador: '',
          email_comprador: '',
          telefono_comprador: '',
          nombre_destinatario: '',
          telefono_destinatario: '',
          carnet_destinatario: '',
          direccion_destinatario: '',
          producto: '',
          notas: '',
          estado: 'pendiente',
        },
  });

  const onSubmit = async (data: PedidoFormData) => {
    try {
      setSubmitting(true);

      // Clean empty strings to null where needed
      const payload = {
        ...data,
        email_comprador: data.email_comprador?.trim() || null,
        carnet_destinatario: data.carnet_destinatario?.trim() || null,
        notas: data.notas?.trim() || null,
      };

      const url = mode === 'edit' && selectedPedido
        ? `/api/pedidos/${selectedPedido.id}`
        : '/api/pedidos';

      const res = await fetch(url, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        toast.success(
          mode === 'edit'
            ? 'Pedido actualizado exitosamente'
            : 'Pedido creado exitosamente'
        );
        triggerRefresh();
        setCurrentView('lista');
      } else {
        toast.error(json.error || 'Error al guardar el pedido');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error al guardar el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView(mode === 'edit' ? 'detalle' : 'lista')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === 'edit' ? 'Editar Pedido' : 'Nuevo Pedido'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'edit'
              ? `Editando pedido #${selectedPedido?.id}`
              : 'Complete el formulario para crear un nuevo pedido'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Comprador Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos del Comprador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre_comprador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nombre <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del comprador" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefono_comprador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Teléfono <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+53 12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email_comprador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Destinatario Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos del Destinatario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre_destinatario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nombre <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del destinatario" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefono_destinatario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Teléfono <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+53 12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="carnet_destinatario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carnet de Identidad</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="direccion_destinatario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Dirección <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Dirección de entrega" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Producto Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Producto y Notas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="producto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Producto <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Descripción del producto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas adicionales</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Instrucciones especiales, detalles de entrega, etc."
                        className="min-h-[100px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentView(mode === 'edit' ? 'detalle' : 'lista')}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {mode === 'edit' ? 'Guardar Cambios' : 'Crear Pedido'}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
