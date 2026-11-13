import type { Metadata } from 'next';
import { LegalPage } from '@/components/ambitosmax/legal-page';

export const metadata: Metadata = {
  title: 'Terms of Service — Leisure Exporting LLC (Ambitosmax)',
  description: 'Terms of Service and End User License Agreement for ambitosmax.com and the Leisure Exporting API.',
  alternates: { canonical: '/terms' },
};

const CONTACTO = 'salesleisureexportingllc@gmail.com · Tel. y WhatsApp +1 (656) 224-8018';

export default function Page() {
  return (
    <LegalPage
      titulo="Terms of Service / Términos de servicio"
      actualizado="November 13, 2026"
      en={[
        { titulo: 'Acceptance', parrafos: ['These Terms are an agreement between you and Leisure Exporting LLC, which operates ambitosmax.com (Ambitosmax). By using ambitosmax.com or connecting the Leisure Exporting API to your QuickBooks Online company, you agree to these Terms and to our Privacy Policy (ambitosmax.com/privacy). If you do not agree, do not use the service.'] },
        { titulo: 'License', parrafos: ['We grant you a limited, non-exclusive, non-transferable, revocable license to use the service for your own business. You may not copy, resell, reverse engineer or misuse the service.'] },
        { titulo: 'QuickBooks connection', parrafos: ['Connecting QuickBooks is optional and authorized by you through Intuit. You can disconnect at any time from our app or from your Intuit account. QuickBooks is a trademark of Intuit Inc.; Leisure Exporting LLC is not affiliated with or endorsed by Intuit.'] },
        { titulo: 'Your responsibilities', parrafos: ['You are responsible for the accuracy of the information you enter, for keeping your login credentials secure, and for complying with applicable laws, including export and sanctions regulations.'] },
        { titulo: 'Orders and services', parrafos: ['Prices, availability and delivery times for products, fuel and shipments to Cuba are shown at the time of the order and may change. Specific conditions for each order are confirmed before payment.'] },
        { titulo: 'Store balance (wallet)', parrafos: ['Registered customers can add funds to a store balance by Zelle, using their personal BM- code in the memo. The balance can only be used to buy products and services from Leisure Exporting LLC on ambitosmax.com. It cannot be transferred to another person, withdrawn as cash or used to pay third parties, and it earns no interest. The maximum balance is $1,000. Unused balance is refunded by Zelle to the customer on request, and is not lost or charged fees for lack of use. Funds become a sale only when a purchase is made.'] },
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
        { titulo: 'Saldo de compras (billetera)', parrafos: ['Los clientes registrados pueden recargar un saldo de compras por Zelle, escribiendo su código personal BM- en la nota. El saldo solo sirve para comprar productos y servicios de Leisure Exporting LLC en ambitosmax.com. No se puede transferir a otra persona, sacar en efectivo ni usar para pagar a terceros, y no genera intereses. El saldo máximo es de $1,000. El saldo no usado se devuelve por Zelle al cliente cuando lo pida, y no se pierde ni se cobra por no usarlo. El dinero solo pasa a ser una venta cuando se hace una compra.'] },
        { titulo: 'Exención y límite de responsabilidad', parrafos: ['El servicio se ofrece "tal cual". En la medida que permita la ley, Leisure Exporting LLC no responde por daños indirectos o consecuentes, ni por fallos de servicios de terceros, incluido QuickBooks.'] },
        { titulo: 'Terminación', parrafos: ['Podemos suspender el acceso si se incumplen estos Términos. Puedes dejar de usar el servicio cuando quieras.'] },
        { titulo: 'Ley aplicable', parrafos: ['Estos Términos se rigen por las leyes del estado de Florida, Estados Unidos.'] },
        { titulo: 'Contacto', parrafos: [CONTACTO] },
      ]}
    />
  );
}
