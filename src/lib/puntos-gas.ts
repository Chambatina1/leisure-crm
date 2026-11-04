// Tipos y utilidades de los puntos de recogida de las balitas de gas.
// La lista la edita el administrador (ver src/lib/puntos-recogida.ts).
// Sin dependencias del servidor: lo usan el formulario y la API de Stripe.
export interface PuntoRecogida {
  id: string;
  nombre: string;
  lugar: string;
  activo: boolean;
}

export function textoPunto(p: Pick<PuntoRecogida, 'nombre' | 'lugar'>): string {
  return p.lugar ? `${p.nombre} (${p.lugar})` : p.nombre;
}

// Las balitas de gas se llaman "CILINDRO ..." en la tienda
export const esBalitaGas = (nombre: string) => /CILINDRO|BALITA|BALA DE GAS/i.test(nombre);
