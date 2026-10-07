'use client';

import { useEffect, useState } from 'react';
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
import { Loader2, User, Mail, Phone, MapPin, Building2, ShieldCheck, ArrowLeft } from 'lucide-react';
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
  // Verificación por código
  const [paso, setPaso] = useState<'datos' | 'codigo'>('datos');
  const [codigo, setCodigo] = useState('');
  const [espera, setEspera] = useState(0);
  const [honeypot, setHoneypot] = useState('');
  const [abiertoEn, setAbiertoEn] = useState(0);

  useEffect(() => {
    if (showRegisterDialog) setAbiertoEn(Date.now());
  }, [showRegisterDialog]);

  useEffect(() => {
    if (espera <= 0) return;
    const id = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [espera]);

  const pedirCodigo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/register/codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          website: honeypot,
          t: abiertoEn,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setPaso('codigo');
        setCodigo('');
        setEspera(60);
        toast.success(`Te enviamos un código a ${form.email}`);
      } else {
        if (json.esperaSegundos) {
          setPaso('codigo');
          setEspera(json.esperaSegundos);
        }
        toast.error(json.error || 'No se pudo enviar el código');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

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
    if (paso === 'datos') {
      if (!validate()) return;
      await pedirCodigo();
      return;
    }

    if (!/^\d{6}$/.test(codigo)) {
      toast.error('Escribe los 6 dígitos del código');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, codigo, website: honeypot }),
      });
      const json = await res.json();

      if (json.ok) {
        setCurrentUser(json.data);
        toast.success('¡Registro exitoso! Bienvenido/a a Ambitosmax');
        setForm(INITIAL_FORM);
        setErrors({});
        setPaso('datos');
        setCodigo('');
        setShowRegisterDialog(false);
      } else {
        toast.error(typeof json.error === 'string' ? json.error : 'Error al registrarse');
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
      setPaso('datos');
      setCodigo('');
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
            className="mx-auto mb-3 w-16 h-16 rounded-2xl bg-[#123d83] flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20"
          >
            <Image
              src="/icon.svg"
              alt="Ambitosmax"
              width={64}
              height={64}
              className="object-contain"
            />
          </motion.div>
          <DialogTitle className="text-xl">Crear Cuenta</DialogTitle>
          <DialogDescription className="text-sm text-center max-w-xs">
            Regístrate en Ambitosmax y accede a todos nuestros servicios
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {/* Campo trampa para bots: invisible para personas */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
            <label htmlFor="reg-website">No llenar</label>
            <input
              id="reg-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {paso === 'codigo' ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 p-3 text-sm text-zinc-700 dark:text-zinc-200">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#123d83]" />
                <span>
                  Escribe el código de 6 dígitos que enviamos a <strong>{form.email}</strong>. Revisa también la carpeta de spam.
                </span>
              </div>
              <Label htmlFor="reg-codigo" className="text-xs font-medium">
                Código de verificación
              </Label>
              <Input
                id="reg-codigo"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                autoFocus
                disabled={loading}
              />
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setPaso('datos')}
                  className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800"
                  disabled={loading}
                >
                  <ArrowLeft className="h-3 w-3" /> Cambiar datos
                </button>
                <button
                  type="button"
                  onClick={pedirCodigo}
                  className="text-[#123d83] font-medium disabled:text-zinc-400"
                  disabled={loading || espera > 0}
                >
                  {espera > 0 ? `Reenviar código en ${espera}s` : 'Reenviar código'}
                </button>
              </div>
            </div>
          ) : (
          <>
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

          </>
          )}

          <Button
            type="submit"
            disabled={
              loading ||
              (paso === 'datos'
                ? !form.nombre.trim() || !form.email.trim() || !form.telefono.trim()
                : codigo.length !== 6)
            }
            className="w-full bg-[#123d83] hover:bg-[#071a46] text-white font-medium mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {paso === 'datos' ? 'Enviando código...' : 'Verificando...'}
              </>
            ) : paso === 'datos' ? (
              'Continuar'
            ) : (
              'Verificar y crear cuenta'
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
