import { redirect } from 'next/navigation';

// Enlace del administrador de la tienda: ambitosmax.com/admin/tienda
export const metadata = { robots: { index: false, follow: false } };

export default function AdminTienda() {
  redirect('/?v=admin-tienda');
}
