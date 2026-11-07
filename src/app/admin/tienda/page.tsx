import { redirect } from 'next/navigation';

// Antiguo enlace de la tienda: ahora todo está en ambitosmax.com/admin (un solo enlace)
export const metadata = { robots: { index: false, follow: false } };

export default function AdminTienda() {
  redirect('/?v=admin');
}
