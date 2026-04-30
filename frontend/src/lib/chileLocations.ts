export interface RegionEntry {
  name: string;
  communes: string[];
}

export const CHILE_LOCATIONS: RegionEntry[] = [
  {
    name: 'Región Metropolitana',
    communes: [
      'Santiago',
      'Providencia',
      'Las Condes',
      'Ñuñoa',
      'Maipú',
      'La Florida',
      'Puente Alto',
      'Recoleta',
      'Independencia',
      'Vitacura',
      'San Miguel',
      'La Reina',
      'Macul',
      'Peñalolén',
      'Lo Barnechea',
      'Estación Central',
      'San Bernardo',
      'Quilicura',
    ],
  },
  {
    name: 'Región de Valparaíso',
    communes: [
      'Valparaíso',
      'Viña del Mar',
      'Concón',
      'Quilpué',
      'Villa Alemana',
      'Quillota',
      'San Antonio',
      'Los Andes',
    ],
  },
  {
    name: 'Región del Biobío',
    communes: [
      'Concepción',
      'Talcahuano',
      'San Pedro de la Paz',
      'Hualpén',
      'Chiguayante',
      'Coronel',
      'Los Ángeles',
    ],
  },
  {
    name: 'Región de Coquimbo',
    communes: ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel'],
  },
  {
    name: 'Región de la Araucanía',
    communes: ['Temuco', 'Padre Las Casas', 'Villarrica', 'Pucón', 'Angol'],
  },
  {
    name: 'Región de Los Lagos',
    communes: ['Puerto Montt', 'Osorno', 'Castro', 'Puerto Varas'],
  },
  {
    name: 'Región de Antofagasta',
    communes: ['Antofagasta', 'Calama', 'Tocopilla', 'Mejillones'],
  },
  {
    name: 'Región del Maule',
    communes: ['Talca', 'Curicó', 'Linares', 'Constitución'],
  },
  {
    name: 'Región de O\'Higgins',
    communes: ['Rancagua', 'Machalí', 'San Fernando', 'Rengo'],
  },
];

export const REGION_NAMES = CHILE_LOCATIONS.map((r) => r.name);

export function getCommunesForRegion(regionName: string | undefined | null): string[] {
  if (!regionName) return [];
  const found = CHILE_LOCATIONS.find((r) => r.name === regionName);
  return found ? found.communes : [];
}
