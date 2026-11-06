// Contacto de atención al cliente que se muestra al público.
export const WHATSAPP_ATENCION = '+53 5859 2766';
export const WHATSAPP_URL = 'https://wa.me/5358592766';
export const EMAIL_ATENCION = 'salesleisureexportingllc@gmail.com';

/** Enlace de WhatsApp a partir de un número o de un enlace ya hecho. */
export function enlaceWhatsapp(valor: string): string {
  if (/^https?:\/\//i.test(valor)) return valor;
  const digitos = valor.replace(/\D/g, '');
  return digitos ? `https://wa.me/${digitos}` : '';
}
