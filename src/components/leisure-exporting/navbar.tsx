'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAppStore, type PublicView, type AdminView } from './store';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Home,
  ShoppingBag,
  Search,
  MessageCircle,
  Menu,
  Lock,
  LogOut,
  Globe,
  BarChart3,
  ClipboardList,
  Database,
  Settings,
  Brain,
  Palette,
  Store,
  Users,
  UserPlus,
} from 'lucide-react';

// ---- PUBLIC NAV ----

const publicNavItems: { view: PublicView; label: string; icon: typeof Home }[] = [
  { view: 'home', label: 'Inicio', icon: Home },
  { view: 'tienda', label: 'Tienda', icon: ShoppingBag },
  { view: 'rastreador', label: 'Rastreador', icon: Search },
  { view: 'chat', label: 'Chat IA', icon: MessageCircle },
];

function PublicNavbar() {
  const { currentView, setCurrentView, goToAdmin, currentUser, setShowRegisterDialog } = useAppStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleNav = (view: PublicView) => {
    setCurrentView(view);
    setSheetOpen(false);
  };

  const isActive = (view: PublicView) => currentView === view;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="w-10 h-10 flex items-center justify-center drop-shadow-sm">
                <Image src="/icon.svg" alt="Leisure Exporting" width={40} height={40} className="object-contain" priority />
              </div>
              <div>
                <h1 className="text-lg font-black text-[#071a46] tracking-wide">LEISURE EXPORTING</h1>
                <p className="text-[11px] text-[#55b949] font-bold tracking-widest uppercase -mt-0.5">
                  Envíos Internacionales
                </p>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {publicNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.view);
                return (
                  <button
                    key={item.view}
                    onClick={() => handleNav(item.view)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-[#123d83] text-white shadow-md'
                        : 'text-zinc-600 hover:text-[#071a46] hover:bg-blue-50 font-semibold'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
              {!currentUser ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRegisterDialog(true)}
                  className="ml-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Registrarse
                </Button>
              ) : (
                <span className="ml-2 text-sm text-zinc-500 hidden lg:inline">
                  {currentUser.nombre}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={goToAdmin}
                className="ml-2 border-[#123d83] text-[#123d83] hover:bg-[#123d83] hover:text-white font-semibold"
              >
                <Lock className="h-4 w-4 mr-1" />
                Admin
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-zinc-500 hover:text-zinc-900">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-white border-zinc-100 p-0">
                <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center overflow-hidden">
                        <Image src="/icon.svg" alt="Leisure Exporting" width={36} height={36} className="object-contain" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-zinc-900">LEISURE EXPORTING</h2>
                        <p className="text-[10px] text-blue-600 font-medium tracking-widest uppercase">
                          Envíos Internacionales
                        </p>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 p-2">
                    {publicNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.view);
                      return (
                        <button
                          key={item.view}
                          onClick={() => handleNav(item.view)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'bg-[#123d83] text-white shadow-md'
                              : 'text-zinc-600 hover:text-[#071a46] hover:bg-blue-50 font-semibold'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                  <div className="p-2 border-t border-zinc-100 space-y-1">
                    {!currentUser && (
                      <button
                        onClick={() => { setShowRegisterDialog(true); setSheetOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-all duration-200"
                      >
                        <UserPlus className="h-5 w-5" />
                        Registrarse
                      </button>
                    )}
                    <button
                      onClick={() => { goToAdmin(); setSheetOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-300 hover:text-zinc-500 hover:bg-zinc-50 transition-all duration-200"
                      >
                        <Lock className="h-5 w-5" />
                        Administración
                      </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {publicNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.view);
            return (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 min-w-[64px] ${
                  active
                    ? 'text-[#123d83] bg-blue-50'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={goToAdmin}
            className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 min-w-[64px] text-[#071a46] bg-blue-50"
          >
            <Lock className="h-5 w-5" />
            <span>Admin</span>
          </button>
        </div>
      </nav>
    </>
  );
}

// ---- ADMIN NAV ----

const adminNavItems: { view: AdminView; label: string; icon: typeof BarChart3 }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { view: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { view: 'tracking', label: 'Tracking', icon: Database },
  { view: 'tienda-admin', label: 'Tienda', icon: Store },
  { view: 'ai-training', label: 'IA Chat', icon: Brain },
  { view: 'apariencia', label: 'Apariencia', icon: Palette },
  { view: 'users', label: 'Usuarios', icon: Users },
  { view: 'config', label: 'Config', icon: Settings },
];

function AdminNavbar() {
  const { adminView, setAdminView, logout, goBackToPublic } = useAppStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleNav = (view: AdminView) => {
    setAdminView(view);
    setSheetOpen(false);
  };

  const isActive = (view: AdminView) => {
    if (view === adminView) return true;
    if (view === 'pedidos' && ['pedido-detail', 'pedido-form', 'pedido-edit'].includes(adminView)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#071a46] via-[#123d83] to-[#123d83] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Admin Badge */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/95 flex items-center justify-center overflow-hidden shadow-sm">
                <Image src="/icon.svg" alt="Leisure Exporting" width={36} height={36} className="object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white tracking-wide">LEISURE EXPORTING</h1>
                  <span className="text-[10px] bg-white/20 text-blue-100 px-2 py-0.5 rounded font-semibold tracking-wide">
                    ADMIN
                  </span>
                </div>
                <p className="text-[10px] text-white/50 font-medium tracking-widest uppercase -mt-0.5">
                  Panel de Administración
                </p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.view);
                return (
                  <button
                    key={item.view}
                    onClick={() => handleNav(item.view)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      active
                        ? 'bg-white/25 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
              <div className="w-px h-6 bg-white/20 mx-1" />
              <button
                onClick={goBackToPublic}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden xl:inline">Ir al Sitio</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/50 hover:text-red-300 hover:bg-white/10 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden xl:inline">Cerrar Sesión</span>
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-white/70 hover:text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-gradient-to-b from-[#071a46] to-[#071a46] border-[#123d83] p-0">
                <SheetTitle className="sr-only">Menú de administración</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
                        <Image src="/icon.svg" alt="Leisure Exporting" width={32} height={32} className="object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-white">Admin Panel</h2>
                          <span className="text-[9px] bg-white/20 text-blue-100 px-1.5 py-0.5 rounded font-semibold">
                            ADMIN
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 p-2 overflow-y-auto">
                    {adminNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.view);
                      return (
                        <button
                          key={item.view}
                          onClick={() => handleNav(item.view)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'bg-white/25 text-white'
                              : 'text-white/60 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                  <div className="p-2 border-t border-white/10 space-y-1">
                    <button
                      onClick={() => { goBackToPublic(); setSheetOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                      <Globe className="h-5 w-5" />
                      Ir al Sitio Público
                    </button>
                    <button
                      onClick={() => { logout(); setSheetOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/50 hover:text-red-300 hover:bg-white/10 transition-all duration-200"
                    >
                      <LogOut className="h-5 w-5" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile Admin Bottom Tab Bar - Show first 5 nav items */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#071a46] to-[#123d83] border-t border-[#123d83]/30 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1 overflow-x-auto">
          {adminNavItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.view);
            return (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium transition-all duration-200 min-w-[56px] ${
                  active
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={goBackToPublic}
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium transition-all duration-200 min-w-[48px] text-white/30 hover:text-white"
          >
            <Globe className="h-5 w-5" />
            <span>Sitio</span>
          </button>
        </div>
      </nav>
    </>
  );
}

// ---- EXPORTED NAVBAR (switches based on mode) ----

export function Navbar() {
  const mode = useAppStore((s) => s.mode);
  return mode === 'admin' ? <AdminNavbar /> : <PublicNavbar />;
}
