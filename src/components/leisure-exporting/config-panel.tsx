'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from './store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Check, Building2, Phone, Clock, Mail, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface ConfigData {
  nombre_negocio: string;
  direccion: string;
  telefono1: string;
  nombre_contacto1: string;
  telefono2: string;
  nombre_contacto2: string;
  telefono3: string;
  nombre_contacto3: string;
  email: string;
  horario: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
}

const DEFAULT_CONFIG: ConfigData = {
  nombre_negocio: 'Leisure Exporting',
  direccion: '2234 A Winter Woods Blvd, Winter Park, Unit 1000, FL 32792',
  telefono1: '786-942-6904',
  nombre_contacto1: 'Geo',
  telefono2: '786-784-6421',
  nombre_contacto2: 'Adriana',
  telefono3: '',
  nombre_contacto3: '',
  email: '',
  horario: 'Lunes a Viernes 9:00 AM - 6:00 PM',
  whatsapp: '',
  instagram: '',
  facebook: '',
};

export function ConfigPanel() {
  const [config, setConfig] = useState<ConfigData>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      const json = await res.json();
      if (json.ok) {
        setConfig({ ...DEFAULT_CONFIG, ...json.data });
      }
    } catch {
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleChange = (key: keyof ConfigData, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: config }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('Configuración guardada');
        setSaved(true);
        // Reload public site data
        window.dispatchEvent(new CustomEvent('config-updated'));
      } else {
        toast.error(json.error || 'Error al guardar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ConfigData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleChange(field, e.target.value);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Configuración</h2>
          <p className="text-sm text-muted-foreground">Administra la información de tu negocio</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className={`bg-amber-500 hover:bg-amber-600 text-black font-semibold min-w-[140px] ${
            saved ? '!bg-green-500 hover:!bg-green-500' : ''
          }`}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</>
          ) : saved ? (
            <><Check className="h-4 w-4 mr-2" /> Guardado</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Guardar</>
          )}
        </Button>
      </div>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-amber-500" />
            Información del Negocio
          </CardTitle>
          <CardDescription>Nombre, dirección y datos generales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_negocio">Nombre del Negocio</Label>
              <Input
                id="nombre_negocio"
                value={config.nombre_negocio}
                onChange={updateField('nombre_negocio')}
                placeholder="Leisure Exporting"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={config.email}
                onChange={updateField('email')}
                placeholder="info@leisure-exporting.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección de la Oficina</Label>
            <Textarea
              id="direccion"
              value={config.direccion}
              onChange={updateField('direccion')}
              placeholder="Dirección completa"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="horario">Horario de Atención</Label>
            <Input
              id="horario"
              value={config.horario}
              onChange={updateField('horario')}
              placeholder="Lunes a Viernes 9:00 AM - 6:00 PM"
            />
          </div>
        </CardContent>
      </Card>

      {/* Phones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5 text-amber-500" />
            Teléfonos de Contacto
          </CardTitle>
          <CardDescription>Puedes agregar hasta 3 números</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((n) => {
            const telefono = config[`telefono${n}` as keyof ConfigData];
            const nombre = config[`nombre_contacto${n}` as keyof ConfigData];
            return (
              <div key={n} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nombre Contacto {n}</Label>
                  <Input
                    value={nombre}
                    onChange={updateField(`nombre_contacto${n}` as keyof ConfigData)}
                    placeholder={`Nombre ${n}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono {n}</Label>
                  <Input
                    value={telefono}
                    onChange={updateField(`telefono${n}` as keyof ConfigData)}
                    placeholder="000-000-0000"
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-amber-500" />
            Redes Sociales y Mensajería
          </CardTitle>
          <CardDescription>WhatsApp, Instagram, Facebook</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={config.whatsapp}
                onChange={updateField('whatsapp')}
                placeholder="+17869426904"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={config.instagram}
                onChange={updateField('instagram')}
                placeholder="@leisure-exporting"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              value={config.facebook}
              onChange={updateField('facebook')}
              placeholder="facebook.com/leisure-exporting"
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center pb-20">
        Los cambios se reflejan inmediatamente en todas las secciones del sitio.
      </p>
    </div>
  );
}
