// Modo pruebas: solo se activa en el sitio de pruebas (Render → Environment
// MODO_PRUEBAS=1). En producción esta variable NO existe y nada cambia.
//
// Con el modo pruebas activo:
//  - ningún correo sale hacia clientes ni hacia ventas: todos van a
//    CORREO_PRUEBAS, con "[PRUEBA]" y los destinatarios originales en el asunto;
//  - si falta CORREO_PRUEBAS, no se envía ningún correo;
//  - la web no redirige a ambitosmax.com, no se indexa en Google y muestra
//    un cartel de "Sitio de pruebas".
export const MODO_PRUEBAS = process.env.MODO_PRUEBAS === '1';

/** Cambia el destinatario y el asunto de un correo cuando el modo pruebas está activo. */
export function destinoCorreo(to: string, subject: string): { to: string; subject: string } {
  if (!MODO_PRUEBAS) return { to, subject };
  const buzon = (process.env.CORREO_PRUEBAS || '').trim();
  if (!buzon) throw new Error('SMTP_NO_CONFIGURADO');
  return { to: buzon, subject: `[PRUEBA → ${to}] ${subject}` };
}
