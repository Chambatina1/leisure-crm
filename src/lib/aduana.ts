// ════════════════════════════════════════════════════════════════════════════
// aduana.ts — Catálogo de equipos duraderos y reglas de la Aduana de Cuba.
// Fuentes: Resolución 175/2024, Aduana General de la República de Cuba (2026).
//
// Reglas principales (importación NO comercial, por envío/consignatario):
//   • Máximo 2 unidades del mismo tipo de electrodoméstico (variedad).
//   • Límite de importación no comercial: 100 kg / $1,000 USD por envío.
//   • Valor exento de arancel: hasta $200 USD (envíos no comerciales).
//   • Beneficio arancelario de electrodomésticos vigente.
// ════════════════════════════════════════════════════════════════════════════

// Catálogo de tipos de electrodomésticos con su categoría de aduana.
export interface TipoEquipo {
  codigo: string;
  nombre: string;
  nombreEn: string;
  icono: string;
}

export const CATALOGO_EQUIPOS: TipoEquipo[] = [
  { codigo: "nevera",      nombre: "Nevera / Refrigerador",   nombreEn: "Refrigerator",    icono: "🧊" },
  { codigo: "cocineta",    nombre: "Cocineta / Stove",        nombreEn: "Cooktop/Stove",   icono: "🔥" },
  { codigo: "horno",       nombre: "Horno eléctrico",          nombreEn: "Electric oven",   icono: "🍳" },
  { codigo: "lavadora",    nombre: "Lavadora",                 nombreEn: "Washing machine", icono: "🫧" },
  { codigo: "secadora",    nombre: "Secadora",                 nombreEn: "Dryer",           icono: "🌀" },
  { codigo: "tv",          nombre: "Televisor / TV",           nombreEn: "Television",      icono: "📺" },
  { codigo: "microondas",  nombre: "Microondas",               nombreEn: "Microwave",       icono: "♨️" },
  { codigo: "aire",        nombre: "Aire acondicionado",       nombreEn: "Air conditioner", icono: "❄️" },
  { codigo: "ventilador",  nombre: "Ventilador",               nombreEn: "Fan",             icono: "💨" },
  { codigo: "plancha",     nombre: "Plancha",                  nombreEn: "Iron",            icono: "🔘" },
  { codigo: "cafetera",    nombre: "Cafetera eléctrica",       nombreEn: "Coffee maker",    icono: "☕" },
  { codigo: "licuadora",   nombre: "Licuadora",                nombreEn: "Blender",         icono: "🥤" },
  { codigo: "freidora",    nombre: "Freidora de aire",         nombreEn: "Air fryer",       icono: "🍟" },
  { codigo: "arrocera",    nombre: "Arrocera eléctrica",       nombreEn: "Rice cooker",     icono: "🍚" },
  { codigo: "equipo",      nombre: "Equipo de sonido",         nombreEn: "Sound system",    icono: "🔊" },
  { codigo: "computadora", nombre: "Computadora / PC",         nombreEn: "Computer",        icono: "💻" },
  { codigo: "impresora",   nombre: "Impresora",                nombreEn: "Printer",         icono: "🖨️" },
  { codigo: "monitor",     nombre: "Monitor",                  nombreEn: "Monitor",         icono: "🖥️" },
  { codigo: "bicicleta",   nombre: "Bicicleta eléctrica",      nombreEn: "E-bike",          icono: "🚲" },
  { codigo: "motobomba",   nombre: "Motobomba",                nombreEn: "Water pump",      icono: "🚰" },
  { codigo: "otro",        nombre: "Otro equipo duradero",     nombreEn: "Other",           icono: "📦" },
];

// Reglas de la Aduana de Cuba (2026).
export const REGLAS_ADUANA = {
  maxUnidadesPorTipo: 2,       // máximo 2 unidades del mismo tipo
  limitePesoKg: 100,           // 100 kg por importación no comercial
  limiteValorUsd: 1000,        // $1,000 USD por importación no comercial
  valorExentoArancel: 200,     // hasta $200 USD exento de arancel
};

export interface ResultadoAduana {
  permitido: boolean;
  tipo: string;
  cantidadActual: number;
  limite: number;
  restantes: number;
  mensaje: string;
  mensajeEn: string;
}

// Consulta: dado un listado de equipos de un consignatario, ¿se puede añadir uno más de este tipo?
export function consultaAduana(
  equipos: { tipo: string }[],
  tipoAñadir: string
): ResultadoAduana {
  const cantidadActual = equipos.filter(e => e.tipo === tipoAñadir).length;
  const limite = REGLAS_ADUANA.maxUnidadesPorTipo;
  const restantes = limite - cantidadActual;
  const permitido = cantidadActual < limite;

  return {
    permitido,
    tipo: tipoAñadir,
    cantidadActual,
    limite,
    restantes: Math.max(0, restantes),
    mensaje: permitido
      ? `Permitido: lleva ${cantidadActual} de ${limite} unidades de este tipo. Puede añadir ${restantes} más.`
      : `No permitido: ya lleva el máximo (${limite}) de unidades de este tipo. Aduana de Cuba rechazaría el excedente.`,
    mensajeEn: permitido
      ? `Allowed: ${cantidadActual} of ${limite} units of this type. ${restantes} more allowed.`
      : `Not allowed: already at max (${limite}) units of this type. Cuban customs would reject the excess.`,
  };
}

// Resumen de aduana para un conjunto de equipos (validación completa).
export interface ResumenAduana {
  totalEquipos: number;
  totalPesoKg: number;
  totalValorUsd: number;
  excedePeso: boolean;
  excedeValor: boolean;
  valorExentoArancel: number;
  arancelEstimado: number;
  alertas: string[];
}

export function resumenAduana(equipos: { tipo: string; valor: number; peso: number }[]): ResumenAduana {
  const totalEquipos = equipos.length;
  const totalPesoKg = equipos.reduce((s, e) => s + (e.peso || 0), 0);
  const totalValorUsd = equipos.reduce((s, e) => s + (e.valor || 0), 0);
  const alertas: string[] = [];

  // Verificar límite de 2 por tipo
  const porTipo: Record<string, number> = {};
  equipos.forEach(e => { porTipo[e.tipo] = (porTipo[e.tipo] || 0) + 1; });
  for (const [tipo, count] of Object.entries(porTipo)) {
    if (count > REGLAS_ADUANA.maxUnidadesPorTipo) {
      alertas.push(`Excede aduana: ${count} unidades de tipo "${tipo}" (máximo ${REGLAS_ADUANA.maxUnidadesPorTipo}).`);
    }
  }
  if (totalPesoKg > REGLAS_ADUANA.limitePesoKg) {
    alertas.push(`Excede peso: ${totalPesoKg.toFixed(1)} kg (límite ${REGLAS_ADUANA.limitePesoKg} kg).`);
  }
  if (totalValorUsd > REGLAS_ADUANA.limiteValorUsd) {
    alertas.push(`Excede valor: $${totalValorUsd.toFixed(2)} USD (límite $${REGLAS_ADUANA.limiteValorUsd} USD).`);
  }

  // Arancel estimado: lo que excede los $200 exentos (simplificado).
  const arancelEstimado = Math.max(0, totalValorUsd - REGLAS_ADUANA.valorExentoArancel);

  return {
    totalEquipos,
    totalPesoKg: Math.round(totalPesoKg * 100) / 100,
    totalValorUsd: Math.round(totalValorUsd * 100) / 100,
    excedePeso: totalPesoKg > REGLAS_ADUANA.limitePesoKg,
    excedeValor: totalValorUsd > REGLAS_ADUANA.limiteValorUsd,
    valorExentoArancel: REGLAS_ADUANA.valorExentoArancel,
    arancelEstimado: Math.round(arancelEstimado * 100) / 100,
    alertas,
  };
}
