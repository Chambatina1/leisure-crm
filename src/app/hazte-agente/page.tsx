import type { Metadata } from 'next';
import { SeoPage } from '@/components/ambitosmax/seo-page';
import { getCurrentView } from '@/components/ambitosmax/seo-helpers';

export const metadata: Metadata = {
  title: "Hazte Agente — Únete a la Red Ambitosmax",
  description: "Genera ingresos enviando paquetes a Cuba desde tu ciudad",
};

export default function Page() {
  return (
    <SeoPage
      titulo="Hazte Agente — Únete a la Red Ambitosmax"
      subtitulo="Genera ingresos enviando paquetes a Cuba desde tu ciudad"
      descripcion="Conviértete en agente autorizado de Ambitosmax y genera ingresos ayudando a tu comunidad a enviar paquetes a Cuba. Capacitación completa y soporte incluido."
      beneficios={['Ingresos por comisión', 'Capacitación gratuita', 'Soporte continuo', 'Portal de agente online', 'Sin inversión inicial', 'Trabaja a tu propio ritmo']}
      faqs={[{q: '¿Cuánto puedo ganar?', a: 'Las comisiones varían según el volumen de envíos. Los agentes activos generan entre $500-$3,000 mensuales.'}, {q: '¿Qué necesito para empezar?', a: 'Solo necesitas un espacio de trabajo, conexión a internet y ganas de crecer.'}, {q: '¿Hay costo de inscripción?', a: 'No, la inscripción es completamente gratuita.'}]}
    />
  );
}
