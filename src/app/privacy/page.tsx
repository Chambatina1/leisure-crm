import type { Metadata } from 'next';
import { LegalPage } from '@/components/ambitosmax/legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy — Leisure Exporting LLC (Ambitosmax)',
  description: 'How Leisure Exporting LLC collects, uses and protects your information, including data accessed through QuickBooks.',
  alternates: { canonical: '/privacy' },
};

const CONTACTO = 'info@ambitosmax.com · WhatsApp +1 (727) 598-6802';

export default function Page() {
  return (
    <LegalPage
      titulo="Privacy Policy / Política de privacidad"
      actualizado="October 26, 2026"
      en={[
        { titulo: 'Who we are', parrafos: ['Leisure Exporting LLC ("we", "us") operates the ambitosmax.com website (Ambitosmax) and the Leisure Exporting API app, which helps our business manage customers, orders, shipments and sales to Cuba. This policy explains what information we collect and how we use it.'] },
        { titulo: 'Information we collect', parrafos: [
          'Information you give us: name, phone number, email, delivery address and the details of your orders.',
          'Information from QuickBooks Online: when a user connects their QuickBooks company to our app, we access only the accounting data needed to provide the service, such as customers, invoices, products and services, and payments, plus the company ID needed to keep the connection.',
          'Technical information: basic server logs (IP address, browser, date and time) used for security and troubleshooting.',
        ] },
        { titulo: 'How we use information', parrafos: ['We use the information only to provide and improve our service: creating and syncing invoices and customers, processing orders and shipments, and contacting you about them. QuickBooks data is used solely for the benefit of the QuickBooks customer who connected it.'] },
        { titulo: 'Sharing', parrafos: ['We do not sell, rent or share your personal or QuickBooks data with third parties for marketing. We share information only with service providers we need to operate (hosting, payment and delivery partners) or when required by law.'] },
        { titulo: 'Security', parrafos: ['All data is transmitted over HTTPS (TLS 1.2 or higher). OAuth access and refresh tokens are stored encrypted on our servers and are never exposed in the browser. Access to our systems is restricted to authorized staff.'] },
        { titulo: 'Retention and deletion', parrafos: ['We keep information only as long as needed to provide the service or meet legal obligations. If you disconnect our app from QuickBooks, we revoke and delete the stored tokens and stop accessing your QuickBooks data. You can ask us at any time to access, correct or delete your information.'] },
        { titulo: 'Changes', parrafos: ['We may update this policy. The date at the top shows when it was last changed.'] },
        { titulo: 'Contact', parrafos: [CONTACTO] },
      ]}
      es={[
        { titulo: 'Quiénes somos', parrafos: ['Leisure Exporting LLC opera el sitio web ambitosmax.com (Ambitosmax) y la aplicación Leisure Exporting API, que nos ayuda a gestionar clientes, pedidos, envíos y ventas a Cuba. Esta política explica qué información recogemos y cómo la usamos.'] },
        { titulo: 'Información que recogemos', parrafos: [
          'La que nos das: nombre, teléfono, correo, dirección de entrega y los datos de tus pedidos.',
          'De QuickBooks Online: cuando un usuario conecta su empresa de QuickBooks, accedemos solo a los datos contables necesarios para el servicio, como clientes, facturas, productos y servicios y pagos, además del identificador de la empresa para mantener la conexión.',
          'Información técnica: registros básicos del servidor (IP, navegador, fecha y hora) para seguridad y resolución de problemas.',
        ] },
        { titulo: 'Cómo usamos la información', parrafos: ['Solo para prestar y mejorar el servicio: crear y sincronizar facturas y clientes, gestionar pedidos y envíos y comunicarnos contigo sobre ellos. Los datos de QuickBooks se usan únicamente en beneficio del cliente que los conectó.'] },
        { titulo: 'Con quién la compartimos', parrafos: ['No vendemos, alquilamos ni compartimos tus datos personales ni los de QuickBooks con terceros para publicidad. Solo los compartimos con proveedores necesarios para operar (alojamiento, pagos y entrega) o cuando la ley lo exige.'] },
        { titulo: 'Seguridad', parrafos: ['Todo se transmite por HTTPS (TLS 1.2 o superior). Los tokens de acceso de QuickBooks se guardan cifrados en nuestros servidores y nunca se muestran en el navegador. Solo personal autorizado accede a nuestros sistemas.'] },
        { titulo: 'Conservación y borrado', parrafos: ['Guardamos la información solo el tiempo necesario para el servicio o para cumplir la ley. Si desconectas nuestra app de QuickBooks, revocamos y borramos los tokens y dejamos de acceder a tus datos. Puedes pedirnos en cualquier momento ver, corregir o borrar tu información.'] },
        { titulo: 'Cambios', parrafos: ['Podemos actualizar esta política. La fecha de arriba indica el último cambio.'] },
        { titulo: 'Contacto', parrafos: [CONTACTO] },
      ]}
    />
  );
}
