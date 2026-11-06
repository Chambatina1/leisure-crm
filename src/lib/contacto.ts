// Contacto de atención al cliente que se muestra al público.
export const WHATSAPP_ATENCION = '+1 (656) 224-8018';
export const WHATSAPP_URL = 'https://wa.me/16562248018';
export const EMAIL_ATENCION = 'salesleisureexportingllc@gmail.com';

/** Enlace de WhatsApp a partir de un número o de un enlace ya hecho. */
export function enlaceWhatsapp(valor: string): string {
  if (/^https?:\/\//i.test(valor)) return valor;
  const digitos = valor.replace(/\D/g, '');
  return digitos ? `https://wa.me/${digitos}` : '';
}
