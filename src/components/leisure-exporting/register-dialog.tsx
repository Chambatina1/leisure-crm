'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAppStore } from './store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface RegisterForm {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
}

const INITIAL_FORM: RegisterForm = {
  nombre: '',
  email: '',
  telefono: '',
  direccion: '',
  ciudad: '',
};

export function RegisterDialog() {
  const showRegisterDialog = useAppStore((s) => s.showRegisterDialog);
  const setShowRegisterDialog = useAppStore((s) => s.setShowRegisterDialog);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterForm>>({});

  const validate = (): boolean => {
    const newErrors: Partial<RegisterForm> = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!form.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email no válido';
    }
    if (!form.telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (json.ok) {
        setCurrentUser(json.data);
        toast.success('¡Registro exitoso! Bienvenido/a a Leisure Exporting');
        setForm(INITIAL_FORM);
        setErrors({});
        setShowRegisterDialog(false);
      } else {
        toast.error(json.error || 'Error al registrarse');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open && !loading) {
      setForm(INITIAL_FORM);
      setErrors({});
    }
    setShowRegisterDialog(open);
  };

  const updateField = (field: keyof RegisterForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const inputClass = (field: keyof RegisterForm) =>
    errors[field] ? 'border-red-500 focus-visible:ring-red-500' : '';

  return (
    <Dialog open={showRegisterDialog} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="mx-auto mb-3 w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center overflow-hidden shadow-lg shadow-amber-500/20"
          >
            <Image
              src="/logo.png"
              alt="Leisure Exporting"
              width={64}
              height={64}
              className="object-contain"
            />
          </motion.div>
          <DialogTitle className="text-xl">Crear Cuenta</DialogTitle>
          <DialogDescription className="text-sm text-center max-w-xs">
            Regístrate en Leisure Exporting y accede a todos nuestros servicios
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-nombre" className="text-xs font-medium">
              Nombre completo *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                id="reg-nombre"
                placeholder="Tu nombre"
                value={form.nombre}
                onChange={updateField('nombre')}
                className={`pl-10 ${inputClass('nombre')}`}
                autoFocus
                disabled={loading}
              />
            </div>
            {errors.nombre && (
              <p className="text-xs text-red-500">{errors.nombre}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-email" className="text-xs font-medium">
              Correo electrónico *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                id="reg-email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={updateField('email')}
                className={`pl-10 ${inputClass('email')}`}
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-telefono" className="text-xs font-medium">
              Teléfono *
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                id="reg-telefono"
                placeholder="+53 0000 0000"
                value={form.telefono}
                onChange={updateField('telefono')}
                className={`pl-10 ${inputClass('telefono')}`}
                disabled={loading}
              />
            </div>
            {errors.telefono && (
              <p className="text-xs text-red-500">{errors.telefono}</p>
            )}
          </div>

          {/* Dirección */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-direccion" className="text-xs font-medium">
              Dirección
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                id="reg-direccion"
                placeholder="Calle, número..."
                value={form.direccion}
                onChange={updateField('direccion')}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Ciudad */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-ciudad" className="text-xs font-medium">
              Ciudad
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                id="reg-ciudad"
                placeholder="Tu ciudad"
                value={form.ciudad}
                onChange={updateField('ciudad')}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !form.nombre.trim() || !form.email.trim() || !form.telefono.trim()}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </Button>

          <p className="text-xs text-center text-zinc-400 mt-2">
            Al registrarte aceptas nuestros términos de servicio
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
