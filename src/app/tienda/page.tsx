import { redirect } from 'next/navigation';

// Enlace corto de la tienda: ambitosmax.com/tienda
export default function Tienda() {
  redirect('/?v=tienda');
}
