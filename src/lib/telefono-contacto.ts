import { db } from '@/lib/db';

// El número de contacto cambió a 656-224-8018 (31-oct-2026). La tabla Config
// guardaba el anterior; se reemplaza una sola vez, solo si sigue el viejo,
// para no pisar lo que el administrador cambie después desde el panel.
let hecho: Promise<void> | null = null;

export function asegurarTelefonoContacto(): Promise<void> {
  if (!hecho) {
    hecho = db.config
      .updateMany({
        where: { clave: 'telefono1', valor: '727-506-1845' },
        data: { valor: '656-224-8018' },
      })
      .then(() => undefined)
      .catch(() => {
        hecho = null;
      });
  }
  return hecho;
}
