export const PROVINCIAS = [
  "Pinar del Rio", "Artemisa", "La Habana", "Mayabeque", "Matanzas",
  "Villa Clara", "Cienfuegos", "Sancti Spiritus", "Ciego de Avila",
  "Camaguey", "Las Tunas", "Holguin", "Granma", "Santiago de Cuba",
  "Guantanamo", "Isla de la Juventud",
] as const;

export const MUNICIPIOS: Record<string, string[]> = {
  "Pinar del Rio": ["Pinar del Rio", "Sandino", "Mantua", "Vinales", "La Palma", "Bahia Honda", "Candelaria", "San Cristobal", "Los Palacios", "Consolacion del Sur"],
  "Artemisa": ["Artemisa", "Caimito", "Guanajay", "Guira de Melena", "Mariel", "San Antonio de los Banos", "Bauta", "Alquizar"],
  "La Habana": ["Playa", "Plaza de la Revolucion", "Centro Habana", "La Habana Vieja", "Regla", "Habana del Este", "Guanabacoa", "San Miguel del Padron", "Diez de Octubre", "Cerro", "Marianao", "La Lisa", "Boyeros", "Arroyo Naranjo", "Cotorro"],
  "Mayabeque": ["San Jose de las Lajas", "Bejucal", "Jaruco", "Santa Cruz del Norte", "Madruga", "Nueva Paz", "San Nicolas de Bari", "Guines", "Melena del Sur", "Batabano", "Quivican"],
  "Matanzas": ["Matanzas", "Cardenas", "Varadero", "Jovellanos", "Pedro Betancourt", "Limonar", "Union de Reyes", "Jaguey Grande", "Colon", "Perico", "Marti", "Calimete", "Los Arabos"],
  "Villa Clara": ["Santa Clara", "Camajuani", "Cifuentes", "Corralillo", "Encrucijada", "Caibarien", "Cumanayagua", "Manicaragua", "Placetas", "Ranchuelo", "Remedios", "Sagua la Grande", "Santo Domingo"],
  "Cienfuegos": ["Cienfuegos", "Aguada de Pasajeros", "Rodas", "Palmira", "Lajas", "Cruces", "Abreus"],
  "Sancti Spiritus": ["Sancti Spiritus", "Cabaiguan", "Jatibonico", "Trinidad", "Yaguajay", "Taguasco", "Fomento", "La Sierpe"],
  "Ciego de Avila": ["Ciego de Avila", "Baragua", "Bolivia", "Chambas", "Ciro Redondo", "Majagua", "Moron", "Primero de Enero", "Venezuela"],
  "Camaguey": ["Camaguey", "Esmeralda", "Florida", "Guaimaro", "Minas", "Najasa", "Nuevitas", "Santa Cruz del Sur", "Sibanicu", "Vertientes"],
  "Las Tunas": ["Las Tunas", "Amancio", "Colombia", "Jesus Menendez", "Jobabo", "Majibacoa", "Manati", "Puerto Padre"],
  "Holguin": ["Holguin", "Antilla", "Baguanos", "Banes", "Cacocum", "Calixto Garcia", "Cueto", "Gibara", "Mayari", "Moa", "Rafael Freyre", "Sagua de Tanamo"],
  "Granma": ["Bayamo", "Bartolome Maso", "Buey Arriba", "Campechuela", "Cauto Cristo", "Guisa", "Jiguani", "Manzanillo", "Media Luna", "Niquero", "Pilon", "Rio Cauto", "Yara"],
  "Santiago de Cuba": ["Santiago de Cuba", "Contramaestre", "Guama", "Mella", "Palma Soriano", "San Luis", "Songo-La Maya", "Segundo Frente"],
  "Guantanamo": ["Guantanamo", "Baracoa", "Caimanera", "El Salvador", "Imias", "Maisi", "Manuel Tames", "Niceto Perez", "Yateras", "San Antonio del Sur"],
  "Isla de la Juventud": ["Nueva Gerona"],
};
