'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/components/leisure-exporting/store';
import { Navbar } from '@/components/leisure-exporting/navbar';
import { LoginDialog } from '@/components/leisure-exporting/login-dialog';
import { RegisterDialog } from '@/components/leisure-exporting/register-dialog';
import { Home } from '@/components/leisure-exporting/home';
import { Tienda } from '@/components/leisure-exporting/tienda';
import { PedidosList } from '@/components/leisure-exporting/pedidos-list';
import { PedidoForm } from '@/components/leisure-exporting/pedido-form';
import { PedidoDetail } from '@/components/leisure-exporting/pedido-detail';
import { AdminDashboard } from '@/components/leisure-exporting/admin-dashboard';
import { TrackingUpload } from '@/components/leisure-exporting/tracking-upload';
import { ConfigPanel } from '@/components/leisure-exporting/config-panel';
import { Rastreador } from '@/components/leisure-exporting/rastreador';
import { ChatIA } from '@/components/leisure-exporting/chat-ia';
import { TiendaAdmin } from '@/components/leisure-exporting/tienda-admin';
import { AITrainingPanel } from '@/components/leisure-exporting/ai-training-panel';
import { AparienciaPanel } from '@/components/leisure-exporting/apariencia-panel';
import { UsersPanel } from '@/components/leisure-exporting/users-panel';
import { Button } from '@/components/ui/button';

// Error-safe component wrapper
function SafeView({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => { setError(null); }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">Error al cargar esta sección</h2>
          <p className="text-sm text-zinc-500 mb-4">{error.message || 'Error desconocido'}</p>
          <Button onClick={() => setError(null)} className="bg-amber-500 hover:bg-amber-600 text-white">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  try {
    return <>{children}</>;
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    setError(e);
    return null;
  }
}

function ThemeInjector() {
  const [themeOverride, setThemeOverride] = useState('');
  const [customCss, setCustomCss] = useState('');
  const [customJs, setCustomJs] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/config');
        const json = await res.json();
        if (json.ok && json.data) {
          const d = json.data;
          const primary = d.theme_primary || '#f59e0b';
          const secondary = d.theme_secondary || '#d97706';
          const accent = d.theme_accent || '#b45309';

          const hexToRgba = (hex: string, alpha: number) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          };

          const darken = (hex: string, amount: number) => {
            let r = parseInt(hex.slice(1, 3), 16);
            let g = parseInt(hex.slice(3, 5), 16);
            let b = parseInt(hex.slice(5, 7), 16);
            r = Math.max(0, Math.floor(r * (1 - amount)));
            g = Math.max(0, Math.floor(g * (1 - amount)));
            b = Math.max(0, Math.floor(b * (1 - amount)));
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          };

          let cssOverrides = `:root {
  --ch-primary: ${primary};
  --ch-secondary: ${secondary};
  --ch-accent: ${accent};
  --ch-primary-dark: ${darken(primary, 0.15)};
  --ch-primary-light: ${hexToRgba(primary, 0.05)};
  --ch-primary-medium: ${hexToRgba(primary, 0.1)};
  --ch-primary-shadow: ${hexToRgba(primary, 0.2)};
  --ch-primary-border: ${hexToRgba(primary, 0.2)};
}\n`;

          cssOverrides += `
/* Theme color overrides - public pages only */
.ch-public .bg-orange-500 { background-color: ${primary} !important; }
.ch-public .from-orange-500 { --tw-gradient-from: ${primary} !important; }
.ch-public .to-amber-500 { --tw-gradient-to: ${secondary} !important; }
.ch-public .hover\\:bg-orange-600:hover { background-color: ${darken(primary, 0.15)} !important; }
.ch-public .hover\\:from-orange-600:hover { --tw-gradient-from: ${darken(primary, 0.15)} !important; }
.ch-public .hover\\:to-amber-600:hover { --tw-gradient-to: ${darken(secondary, 0.15)} !important; }
.ch-public .hover\\:bg-orange-50:hover { background-color: ${hexToRgba(primary, 0.05)} !important; }
.ch-public .text-orange-500 { color: ${primary} !important; }
.ch-public .text-orange-600 { color: ${darken(primary, 0.1)} !important; }
.ch-public .text-orange-700 { color: ${darken(primary, 0.2)} !important; }
.ch-public .text-orange-400 { color: ${hexToRgba(primary, 0.7)} !important; }
.ch-public .bg-orange-50 { background-color: ${hexToRgba(primary, 0.05)} !important; }
.ch-public .bg-orange-100 { background-color: ${hexToRgba(primary, 0.1)} !important; }
.ch-public .border-orange-200 { border-color: ${hexToRgba(primary, 0.2)} !important; }
.ch-public .border-orange-100 { border-color: ${hexToRgba(primary, 0.1)} !important; }
.ch-public .focus\\:border-orange-400:focus { border-color: ${primary} !important; }
.ch-public .shadow-orange-500\\/20 { --tw-shadow-color: ${hexToRgba(primary, 0.2)} !important; }
.ch-public .shadow-orange-500\\/10 { --tw-shadow-color: ${hexToRgba(primary, 0.1)} !important; }
.ch-public .shadow-orange-500\\/5 { --tw-shadow-color: ${hexToRgba(primary, 0.05)} !important; }
.ch-public .ring-orange-400 { --tw-ring-color: ${primary} !important; }
.ch-public .ring-2 { --tw-ring-color: ${primary} !important; }
.ch-public .data\\[state=active\\]\\:bg-amber-500[data-state=active] { background-color: ${primary} !important; }
.ch-public .data\\[state=active\\]\\:bg-amber-400[data-state=active] { background-color: ${primary} !important; }

/* Navbar active state */
.ch-public .bg-orange-50.text-orange-700,
.ch-public nav button[class*=bg-orange-50] {
  background-color: ${hexToRgba(primary, 0.05)} !important;
  color: ${darken(primary, 0.2)} !important;
}

/* Bottom tab bar active */
.ch-public .text-orange-600 {
  color: ${primary} !important;
}

/* Amber accent overrides (secondary color) */
.ch-public .bg-amber-50 { background-color: ${hexToRgba(secondary, 0.05)} !important; }
.ch-public .bg-amber-100 { background-color: ${hexToRgba(secondary, 0.1)} !important; }
.ch-public .bg-amber-500 { background-color: ${secondary} !important; }
.ch-public .hover\\:bg-amber-600:hover { background-color: ${darken(secondary, 0.15)} !important; }
.ch-public .text-amber-500 { color: ${secondary} !important; }
.ch-public .text-amber-600 { color: ${darken(secondary, 0.1)} !important; }
.ch-public .from-amber-400 { --tw-gradient-from: ${secondary} !important; }
.ch-public .to-amber-500 { --tw-gradient-to: ${secondary} !important; }

/* Orange-50 background variants */
.ch-public .bg-gradient-to-b { }
.ch-public .via-orange-50\\/30 { --tw-gradient-via: ${hexToRgba(primary, 0.03)} !important; }
`;

          setThemeOverride(cssOverrides);
          if (d.custom_css) setCustomCss(d.custom_css);
          if (d.custom_js) setCustomJs(d.custom_js);
        }
      } catch {}
    }
    load();
    function onConfigUpdated() { load(); }
    window.addEventListener('config-updated', onConfigUpdated);
    return () => window.removeEventListener('config-updated', onConfigUpdated);
  }, []);

  useEffect(() => {
    if (customJs) {
      try { const fn = new Function(customJs); fn(); } catch {}
    }
  }, [customJs]);

  return (
    <>
      {themeOverride && <style>{themeOverride}</style>}
      {customCss && <style>{customCss}</style>}
    </>
  );
}

export default function Page() {
  const mode = useAppStore((s) => s.mode);
  const currentView = useAppStore((s) => s.currentView);
  const adminView = useAppStore((s) => s.adminView);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const viewKey = mode === 'admin' ? `admin-${adminView}` : `public-${currentView}`;

  const renderView = useCallback(() => {
    if (mode === 'public') {
      switch (currentView) {
        case 'home': return <Home />;
        case 'tienda': return <Tienda />;
        case 'rastreador': return <Rastreador />;
        case 'chat': return <ChatIA />;
        case 'pedido-public': return <PedidoForm />;
        default: return <Home />;
      }
    } else {
      switch (adminView) {
        case 'dashboard': return <AdminDashboard />;
        case 'pedidos': return <PedidosList />;
        case 'pedido-form': return <PedidoForm />;
        case 'pedido-detail': return <PedidoDetail />;
        case 'pedido-edit': return <PedidoForm />;
        case 'tracking': return <TrackingUpload />;
        case 'config': return <ConfigPanel />;
        case 'tienda-admin': return <TiendaAdmin />;
        case 'ai-training': return <AITrainingPanel />;
        case 'apariencia': return <AparienciaPanel />;
        case 'users': return <UsersPanel />;
        case 'emails': return <ConfigPanel />;
        default: return <AdminDashboard />;
      }
    }
  }, [mode, currentView, adminView]);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center p-8 max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Algo salió mal</h1>
          <p className="text-sm text-zinc-500 mb-1">{errorMsg}</p>
          <p className="text-xs text-zinc-400 mb-6">Esto puede deberse a datos temporales corruptos.</p>
          <button
            onClick={() => {
              try { localStorage.clear(); } catch {}
              window.location.reload();
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors"
          >
            Limpiar y Recargar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ThemeInjector />
      <div className={`min-h-screen flex flex-col bg-background ${mode === 'public' ? 'ch-public' : ''}`}>
        <Navbar />
        <main className="flex-1">
          <SafeView>
            <AnimatePresence mode="wait">
              <motion.div
                key={viewKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </SafeView>
        </main>
        <LoginDialog />
        <RegisterDialog />
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('error', function(e) {
              try {
                localStorage.setItem('leisure-exporting-error', JSON.stringify({ msg: e.message, time: Date.now() }));
              } catch(err) {}
            });
            window.addEventListener('unhandledrejection', function(e) {
              try {
                localStorage.setItem('leisure-exporting-error', JSON.stringify({ msg: String(e.reason), time: Date.now() }));
              } catch(err) {}
            });
          `,
        }}
      />
    </>
  );
}
