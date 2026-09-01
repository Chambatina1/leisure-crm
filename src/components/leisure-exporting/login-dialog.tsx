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
import { Lock, Loader2, AlertCircle } from 'lucide-react';

export function LoginDialog() {
  const showLoginDialog = useAppStore((s) => s.showLoginDialog);
  const setShowLoginDialog = useAppStore((s) => s.setShowLoginDialog);
  const login = useAppStore((s) => s.login);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    // Small delay for UX feedback
    await new Promise((r) => setTimeout(r, 400));

    const success = login(password);
    if (success) {
      setPassword('');
      setError('');
    } else {
      setError('Contraseña incorrecta');
    }
    setLoading(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setPassword('');
      setError('');
    }
    setShowLoginDialog(open);
  };

  return (
    <Dialog open={showLoginDialog} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center items-center">
          <div className="mx-auto mb-3 w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center overflow-hidden shadow-lg shadow-amber-500/20">
            <Image src="/logo.png" alt="Leisure Exporting" width={64} height={64} className="object-contain" />
          </div>
          <DialogTitle className="text-xl">Acceso Administrativo</DialogTitle>
          <DialogDescription>
            Ingresa la contraseña para acceder al panel de administración
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              className={`pl-10 ${error ? 'border-red-500' : ''}`}
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
