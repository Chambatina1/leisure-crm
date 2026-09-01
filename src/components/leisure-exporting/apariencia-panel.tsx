'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Save,
  Loader2,
  Check,
  Palette,
  Image as ImageIcon,
  Code2,
  Search,
  Type,
  Globe,
  Layout,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface AparienciaData {
  custom_logo: string;
  custom_hero: string;
  custom_favicon: string;
  custom_css: string;
  custom_html: string;
  custom_js: string;
  theme_primary: string;
  theme_secondary: string;
  theme_accent: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
}

const DEFAULT_DATA: AparienciaData = {
  custom_logo: '',
  custom_hero: '',
  custom_favicon: '',
  custom_css: '',
  custom_html: '',
  custom_js: '',
  theme_primary: '#f59e0b',
  theme_secondary: '#d97706',
  theme_accent: '#b45309',
  seo_title: 'Leisure Exporting - Envíos y Servicios',
  seo_description: 'Servicios de envíos, bicicletas, cajas y más.',
  seo_keywords: 'leisure-exporting, envios, cuba, miami',
};

const CONFIG_KEYS = [
  'custom_logo',
  'custom_hero',
  'custom_favicon',
  'custom_css',
  'custom_html',
  'custom_js',
  'theme_primary',
  'theme_secondary',
  'theme_accent',
  'seo_title',
  'seo_description',
  'seo_keywords',
] as const;

export function AparienciaPanel() {
  const [data, setData] = useState<AparienciaData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/config');
      const json = await res.json();
      if (json.ok && json.data) {
        const loaded: Partial<AparienciaData> = {};
        CONFIG_KEYS.forEach((key) => {
          if (json.data[key] !== undefined) {
            (loaded as Record<string, string>)[key] = json.data[key];
          }
        });
        setData({ ...DEFAULT_DATA, ...loaded });
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

  const updateField = (key: keyof AparienciaData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setData((prev) => ({ ...prev, [key]: e.target.value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const configs: Record<string, string> = {};
      CONFIG_KEYS.forEach((key) => {
        (configs as Record<string, string>)[key] = data[key];
      });

      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs }),
      });
      const json = await res.json();

      if (json.ok) {
        toast.success('Apariencia guardada correctamente');
        setSaved(true);
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

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layout className="h-7 w-7 text-amber-500" />
            Apariencia
          </h2>
          <p className="text-sm text-muted-foreground">
            Personaliza el aspecto visual y el código del sitio
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className={`bg-amber-500 hover:bg-amber-600 text-white font-semibold min-w-[140px] ${
            saved ? '!bg-green-500 hover:!bg-green-500' : ''
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Guardado
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </>
          )}
        </Button>
      </div>

      {/* Section 1: Imágenes del Sitio */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-amber-600" />
            </div>
            Imágenes del Sitio
          </CardTitle>
          <CardDescription>
            Logo principal, imagen de fondo y favicon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Logo Principal
            </Label>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden shrink-0">
                {data.custom_logo ? (
                  <img
                    src={data.custom_logo}
                    alt="Logo preview"
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-zinc-300" />
                )}
              </div>
              <div className="flex-1 w-full">
                <Input
                  value={data.custom_logo}
                  onChange={updateField('custom_logo')}
                  placeholder="https://ejemplo.com/logo.png"
                  className="text-sm"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  URL de la imagen del logo (PNG, SVG recomendado)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Hero Background */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Imagen de Fondo (Hero)
            </Label>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="w-32 h-20 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden shrink-0">
                {data.custom_hero ? (
                  <img
                    src={data.custom_hero}
                    alt="Hero preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-zinc-300" />
                )}
              </div>
              <div className="flex-1 w-full">
                <Input
                  value={data.custom_hero}
                  onChange={updateField('custom_hero')}
                  placeholder="https://ejemplo.com/hero-background.jpg"
                  className="text-sm"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Imagen de fondo para la sección principal
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Favicon */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Favicon
            </Label>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="w-12 h-12 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden shrink-0">
                {data.custom_favicon ? (
                  <img
                    src={data.custom_favicon}
                    alt="Favicon preview"
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon className="h-4 w-4 text-zinc-300" />
                )}
              </div>
              <div className="flex-1 w-full">
                <Input
                  value={data.custom_favicon}
                  onChange={updateField('custom_favicon')}
                  placeholder="https://ejemplo.com/favicon.ico"
                  className="text-sm"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Icono del navegador (ICO, PNG 32x32 recomendado)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Personalización con Código */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
              <Code2 className="h-5 w-5 text-orange-600" />
            </div>
            Personalización con Código
          </CardTitle>
          <CardDescription>
            Agrega CSS, HTML y JavaScript personalizado a tu sitio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="css" className="space-y-3">
            <TabsList className="bg-zinc-100 p-1 w-full sm:w-auto">
              <TabsTrigger
                value="css"
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-white text-xs"
              >
                CSS
              </TabsTrigger>
              <TabsTrigger
                value="html"
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-white text-xs"
              >
                HTML
              </TabsTrigger>
              <TabsTrigger
                value="js"
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-white text-xs"
              >
                JavaScript
              </TabsTrigger>
            </TabsList>

            <TabsContent value="css">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">
                    CSS Personalizado
                  </Label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {data.custom_css.length} caracteres
                  </span>
                </div>
                <Textarea
                  value={data.custom_css}
                  onChange={updateField('custom_css')}
                  placeholder={`/* Tu CSS personalizado */\n.custom-class {\n  color: #f59e0b;\n}`}
                  rows={10}
                  className="font-mono text-xs bg-zinc-900 text-green-400 border-zinc-700 resize-y"
                />
              </div>
            </TabsContent>

            <TabsContent value="html">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">
                    HTML Personalizado (Header/Footer)
                  </Label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {data.custom_html.length} caracteres
                  </span>
                </div>
                <Textarea
                  value={data.custom_html}
                  onChange={updateField('custom_html')}
                  placeholder={`<!-- Código HTML personalizado -->\n<div class="custom-banner">\n  <p>Mensaje personalizado</p>\n</div>`}
                  rows={10}
                  className="font-mono text-xs bg-zinc-900 text-blue-400 border-zinc-700 resize-y"
                />
              </div>
            </TabsContent>

            <TabsContent value="js">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">
                    JavaScript Personalizado
                  </Label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {data.custom_js.length} caracteres
                  </span>
                </div>
                <Textarea
                  value={data.custom_js}
                  onChange={updateField('custom_js')}
                  placeholder={`// Tu JavaScript personalizado\nconsole.log('Leisure Exporting custom JS loaded');`}
                  rows={10}
                  className="font-mono text-xs bg-zinc-900 text-yellow-400 border-zinc-700 resize-y"
                />
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  El JavaScript se ejecutará después de cargar la página
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Section 3: Colores del Tema */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <Palette className="h-5 w-5 text-amber-600" />
            </div>
            Colores del Tema
          </CardTitle>
          <CardDescription>
            Personaliza los colores principales del sitio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Color Primario */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-3 shrink-0">
              <div
                className="w-10 h-10 rounded-lg border-2 border-zinc-200 shadow-sm"
                style={{ backgroundColor: data.theme_primary }}
              />
              <Label className="text-sm font-medium">Color Primario</Label>
            </div>
            <div className="flex-1 w-full flex gap-2">
              <Input
                type="color"
                value={data.theme_primary}
                onChange={updateField('theme_primary')}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={data.theme_primary}
                onChange={updateField('theme_primary')}
                placeholder="#f59e0b"
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Color Secundario */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-3 shrink-0">
              <div
                className="w-10 h-10 rounded-lg border-2 border-zinc-200 shadow-sm"
                style={{ backgroundColor: data.theme_secondary }}
              />
              <Label className="text-sm font-medium">Color Secundario</Label>
            </div>
            <div className="flex-1 w-full flex gap-2">
              <Input
                type="color"
                value={data.theme_secondary}
                onChange={updateField('theme_secondary')}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={data.theme_secondary}
                onChange={updateField('theme_secondary')}
                placeholder="#d97706"
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Color de Acento */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-3 shrink-0">
              <div
                className="w-10 h-10 rounded-lg border-2 border-zinc-200 shadow-sm"
                style={{ backgroundColor: data.theme_accent }}
              />
              <Label className="text-sm font-medium">Color de Acento</Label>
            </div>
            <div className="flex-1 w-full flex gap-2">
              <Input
                type="color"
                value={data.theme_accent}
                onChange={updateField('theme_accent')}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={data.theme_accent}
                onChange={updateField('theme_accent')}
                placeholder="#b45309"
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Preview bar */}
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">
              Vista previa de los colores:
            </p>
            <div className="h-8 rounded-lg overflow-hidden flex">
              <div
                className="flex-1"
                style={{ backgroundColor: data.theme_primary }}
              />
              <div
                className="flex-1"
                style={{ backgroundColor: data.theme_secondary }}
              />
              <div
                className="flex-1"
                style={{ backgroundColor: data.theme_accent }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Meta Tags SEO */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Search className="h-5 w-5 text-emerald-600" />
            </div>
            Meta Tags SEO
          </CardTitle>
          <CardDescription>
            Optimiza la visibilidad de tu sitio en buscadores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Type className="h-3.5 w-3.5 text-zinc-400" />
              <Label className="text-xs font-medium">Título del Sitio</Label>
            </div>
            <Input
              value={data.seo_title}
              onChange={updateField('seo_title')}
              placeholder="Leisure Exporting - Envíos y Servicios"
            />
            <p className="text-xs text-zinc-400">
              Aparece en la pestaña del navegador y resultados de búsqueda
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-zinc-400" />
              <Label className="text-xs font-medium">Descripción</Label>
            </div>
            <Textarea
              value={data.seo_description}
              onChange={updateField('seo_description')}
              placeholder="Breve descripción del sitio (150-160 caracteres recomendados)"
              rows={2}
              className="text-sm"
            />
            <div className="flex justify-between">
              <p className="text-xs text-zinc-400">
                Meta descripción para buscadores
              </p>
              <span
                className={`text-xs font-mono ${
                  data.seo_description.length > 160
                    ? 'text-red-500'
                    : 'text-zinc-400'
                }`}
              >
                {data.seo_description.length}/160
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-zinc-400" />
              <Label className="text-xs font-medium">Keywords</Label>
            </div>
            <Input
              value={data.seo_keywords}
              onChange={updateField('seo_keywords')}
              placeholder="envios, cuba, miami, paquetes, leisure-exporting"
            />
            <p className="text-xs text-zinc-400">
              Palabras clave separadas por comas
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Bottom Save */}
      <div className="flex justify-end pb-20">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className={`bg-amber-500 hover:bg-amber-600 text-white font-semibold min-w-[160px] ${
            saved ? '!bg-green-500 hover:!bg-green-500' : ''
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Guardado ✓
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
