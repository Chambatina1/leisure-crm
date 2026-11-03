// Puntos donde se recogen las balitas (cilindros) de gas compradas en la tienda.
// Son los dos únicos sitios con balitas; el cliente elige uno al pagar.
// Sin dependencias del servidor: lo usan el formulario y la API de Stripe.
export const PUNTOS_GAS = {
  'bar-madera': {
    nombre: 'Punto de Gas de Madera',
    lugar: 'Arroyo Arena, La Lisa',
  },
  barbosa: {
    nombre: 'Punto de venta Barbosa',
    lugar: 'Municipio Playa',
  },
} as const;

export type PuntoGas = keyof typeof PUNTOS_GAS;
export const CLAVES_PUNTOS_GAS = Object.keys(PUNTOS_GAS) as [PuntoGas, ...PuntoGas[]];

export function textoPuntoGas(p: PuntoGas): string {
  return `${PUNTOS_GAS[p].nombre} (${PUNTOS_GAS[p].lugar})`;
}

// Las balitas de gas se llaman "CILINDRO ..." en la tienda
export const esBalitaGas = (nombre: string) => /CILINDRO|BALITA|BALA DE GAS/i.test(nombre);
