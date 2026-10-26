import type { Metadata } from 'next';
import { LegalPage } from '@/components/ambitosmax/legal-page';

export const metadata: Metadata = {
  title: 'Terms of Service — Leisure Exporting LLC (Ambitosmax)',
  description: 'Terms of Service and End User License Agreement for ambitosmax.com and the Leisure Exporting API.',
  alternates: { canonical: '/terms' },
};

const CONTACTO = 'info@ambitosmax.com · WhatsApp +1 (727) 598-6802';

export default function Page() {
  return (
    <LegalPage
      titulo="Terms of Service / Términos de servicio"
      actualizado="October 26, 2026"
      en={[
        { titulo: 'Acceptance', parrafos: ['These Terms are an agreement between you and Leisure Exporting LLC, which operates ambitosmax.com (Ambitosmax). By using ambitosmax.com or connecting the Leisure Exporting API to your QuickBooks Online company, you agree to these Terms and to our Privacy Policy (ambitosmax.com/privacy). If you do not agree, do not use the service.'] },
        { titulo: 'License', parrafos: ['We grant you a limited, non-exclusive, non-transferable, revocable license to use the service for your own business. You may not copy, resell, reverse engineer or misuse the service.'] },
        { titulo: 'QuickBooks connection', parrafos: ['Connecting QuickBooks is optional and authorized by you through Intuit. You can disconnect at any time from our app or from your Intuit account. QuickBooks is a trademark of Intuit Inc.; Leisure Exporting LLC is not affiliated with or endorsed by Intuit.'] },
        { titulo: 'Your responsibilities', parrafos: ['You are responsible for the accuracy of the information you enter, for keeping your login credentials secure, and for complying with applicable laws, including export and sanctions regulations.'] },
        { titulo: 'Orders and services', parrafos: ['Prices, availability and delivery times for products, fuel and shipments to Cuba are shown at the time of the order and may change. Specific conditions for each order are confirmed before payment.'] },
        { titulo: 'Disclaimer and limitation of liability', parrafos: ['The service is provided "as is". To the maximum extent permitted by law, Leisure Exporting LLC is not liable for indirect, incidental or consequential damages, or for errors caused by third-party services, including QuickBooks.'] },
        { titulo: 'Termination', parrafos: ['We may suspend or end access if these Terms are violated. You may stop using the service at any time.'] },
        { titulo: 'Governing law', parrafos: ['These Terms are governed by the laws of the State of Florida, United States.'] },
        { titulo: 'Contact', parrafos: [CONTACTO] },
      ]}
      es={[
        { titulo: 'Aceptación', parrafos: ['Estos Términos son un acuerdo entre tú y Leisure Exporting LLC, que opera ambitosmax.com (Ambitosmax). Al usar ambitosmax.com o conectar Leisure Exporting API a tu empresa de QuickBooks Online, aceptas estos Términos y nuestra Política de privacidad (ambitosmax.com/privacy). Si no estás de acuerdo, no uses el servicio.'] },
        { titulo: 'Licencia', parrafos: ['Te damos una licencia limitada, no exclusiva, intransferible y revocable para usar el servicio en tu propio negocio. No puedes copiarlo, revenderlo, hacerle ingeniería inversa ni usarlo de forma indebida.'] },
        { titulo: 'Conexión con QuickBooks', parrafos: ['Conectar QuickBooks es opcional y lo autorizas tú a través de Intuit. Puedes desconectarlo cuando quieras desde nuestra app o desde tu cuenta de Intuit. QuickBooks es marca de Intuit Inc.; Leisure Exporting LLC no está afiliada ni respaldada por Intuit.'] },
        { titulo: 'Tus responsabilidades', parrafos: ['Eres responsable de que la información que introduces sea correcta, de proteger tus credenciales y de cumplir las leyes aplicables, incluidas las de exportación y sanciones.'] },
        { titulo: 'Pedidos y servicios', parrafos: ['Los precios, la disponibilidad y los plazos de productos, combustible y envíos a Cuba se muestran al hacer el pedido y pueden cambiar. Las condiciones de cada pedido se confirman antes del pago.'] },
        { titulo: 'Exención y límite de responsabilidad', parrafos: ['El servicio se ofrece "tal cual". En la medida que permita la ley, Leisure Exporting LLC no responde por daños indirectos o consecuentes, ni por fallos de servicios de terceros, incluido QuickBooks.'] },
        { titulo: 'Terminación', parrafos: ['Podemos suspender el acceso si se incumplen estos Términos. Puedes dejar de usar el servicio cuando quieras.'] },
        { titulo: 'Ley aplicable', parrafos: ['Estos Términos se rigen por las leyes del estado de Florida, Estados Unidos.'] },
        { titulo: 'Contacto', parrafos: [CONTACTO] },
      ]}
    />
  );
}
