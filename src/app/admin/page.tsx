import { redirect } from 'next/navigation';

// Enlace de administración (no hay botón en la web): ambitosmax.com/admin
export const metadata = { robots: { index: false, follow: false } };

export default function Admin() {
  redirect('/?v=admin');
}
