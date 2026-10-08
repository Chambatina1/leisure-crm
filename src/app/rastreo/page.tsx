import type { Metadata } from 'next';
import { SeoPage } from '@/components/ambitosmax/seo-page';

export const metadata: Metadata = {
  title: "Rastreo de Envíos — Sigue Tu Paquete en Tiempo Real",
  description: "Ingresa tu número CPK y conoce el estado de tu envío",
  alternates: { canonical: '/rastreo' },
  openGraph: { url: '/rastreo', title: "Rastreo de Envíos — Sigue Tu Paquete en Tiempo Real", description: "Ingresa tu número CPK y conoce el estado de tu envío", type: 'website', siteName: 'Ambitosmax', locale: 'es_US' },
};

export default function Page() {
  return (
    <SeoPage
      ruta="/rastreo"
      titulo="Rastreo de Envíos — Sigue Tu Paquete en Tiempo Real"
      subtitulo="Ingresa tu número CPK y conoce el estado de tu envío"
      descripcion="Rastrea tu envío a Cuba en tiempo real con nuestro sistema de tracking. Ingresa tu número CPK-XXXXXXX y ve exactamente dónde está tu paquete."
      beneficios={['Tracking en tiempo real', 'Historial completo de eventos', 'Notificaciones automáticas', 'Disponible 24/7', 'Funciona desde cualquier dispositivo']}
      faqs={[{q: '¿Dónde encuentro mi número CPK?', a: 'Te lo entregamos al recibir tu paquete. Empieza con CPK- seguido de 7 dígitos.'}, {q: '¿Con qué frecuencia se actualiza?', a: 'El sistema se actualiza automáticamente cada vez que tu paquete cambia de estado.'}]}
    />
  );
}
