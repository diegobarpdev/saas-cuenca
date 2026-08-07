/**
 * Yapi.ec Pattern Registry - Versión Premium Editorial
 * Colección de texturas abstractas y geométricas inspiradas en la identidad visual de cada negocio.
 * Diseñadas sin íconos ni ilustraciones literales de comida. Prioriza geometría, materiales, líneas y microdetalles.
 */

import { PatternType } from '@/lib/types/database';
export type { PatternType };

// Helper para codificar SVG a Data URI seguro
function svgToDataUri(svgContent: string): string {
  const cleaned = svgContent
    .replace(/"/g, "'")
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/{/g, '%7B')
    .replace(/}/g, '%7D')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/\s+/g, ' ');
  return `data:image/svg+xml,${cleaned}`;
}

export interface PatternDefinition {
  id: PatternType;
  label: string;
  desc: string;
  category: 'Comida' | 'Bebida' | 'Dulces' | 'Universal';
}

export const PATTERNS_LIST: PatternDefinition[] = [
  { id: 'ondas_fluidas', label: '🌊 Ondas Curvas Fluídas', desc: 'Seda líquida interactiva en movimiento continuo (Canvas)', category: 'Universal' },
  { id: 'malla_aurora', label: '🌌 Malla Aurora Difusa', desc: 'Resplandores neón ambientales sin líneas fijas', category: 'Universal' },
  { id: 'lineas_geomets', label: '📐 Rejilla Tech Grid', desc: 'Cuadrícula minimalista con textura de precisión', category: 'Universal' },
  { id: 'degradado_luxe', label: '✨ Degradado Velvet Luxe', desc: 'Fondo degradado cálido oro y obsidian', category: 'Universal' },
  { id: 'sin_patron', label: '🚫 Sin Patrón (Sólido)', desc: 'Fondo oscuro plano y limpio sin gráficos', category: 'Universal' },
  
  // Categoría Comida (Identidad Abstracta)
  { id: 'restaurante_general', label: '🍽️ Minimalismo Gourmet', desc: 'Marcos anidados concéntricos de fina línea editorial', category: 'Comida' },
  { id: 'cafeteria', label: '☕ Grano Terrazzo', desc: 'Textura mineral de fragmentos geométricos y lunares', category: 'Comida' },
  { id: 'panaderia', label: '🥐 Espiga Herringbone', desc: 'Trama textil de lino rústico y espiga entrelazada', category: 'Comida' },
  { id: 'pasteleria', label: '🧁 Arcos Art Nouveau', desc: 'Líneas curvas festoneadas y ondas concéntricas finas', category: 'Comida' },
  { id: 'pizzeria', label: '🍕 Mosaico de Ladrillo', desc: 'Rejilla ortogonal de baldosas de piedra volcánica', category: 'Comida' },
  { id: 'hamburgueseria', label: '🍔 Brutalismo Industrial', desc: 'Líneas diagonales atrevidas y rejilla de metal perforado', category: 'Comida' },
  { id: 'sushi_japones', label: '🥢 Estilo Zen Karesansui', desc: 'Líneas rastrilladas continuas de jardín zen y shoji', category: 'Comida' },
  { id: 'comida_mexicana', label: '🌮 Chevron Terracota', desc: 'Greca azteca geométrica y líneas angulares limpias', category: 'Comida' },
  { id: 'comida_italiana', label: '🍝 Mosaico de Majólica', desc: 'Geometrías ornamentales del mediterráneo toscano', category: 'Comida' },
  { id: 'mariscos', label: '🐟 Yacht Teak Wood', desc: 'Líneas paralelas limpias de madera de cubierta de yate', category: 'Comida' },
  { id: 'comida_rapida', label: '🍟 Retromoderno Isometric', desc: 'Cubos isométricos flotantes en perspectiva lineal', category: 'Comida' },
  { id: 'comida_saludable', label: '🥑 Celular Voronoi', desc: 'Estructuras celulares orgánicas y nervaduras vegetales', category: 'Comida' },
  { id: 'parrilladas', label: '🥩 Carbón Hatching', desc: 'Trama cruzada manual de carbón y texturas de pizarra', category: 'Comida' },

  // Categoría Bebida
  { id: 'bar_cocteles', label: '🍹 Gatsby Fan Deco', desc: 'Patrón de abanico Art Deco dorado de los años 20', category: 'Bebida' },
  { id: 'vinos', label: '🍷 Anillos Burdeos', desc: 'Círculos concéntricos finos de prensas y barricas', category: 'Bebida' },
  { id: 'cerveceria', label: '🍺 Malla de Panal Hex', desc: 'Rejilla hexagonal industrial de cobre y latón', category: 'Bebida' },

  // Categoría Dulces
  { id: 'heladeria_postres', label: '🍦 Mármol Fluido', desc: 'Líneas ondulantes y vetas fluidas de cuarzo y crema', category: 'Dulces' },

  // Categoría Universal / Texturas
  { id: 'geometria_moderna', label: '🔶 Rombos Abstractos', desc: 'Mosaico sutil de rombos y puntos continuos', category: 'Universal' },
  { id: 'lineas_organicas', label: '🌀 Trazos Zen Continuos', desc: 'Ondas suaves continuas estilo trazo a mano alzada', category: 'Universal' },
  { id: 'hojas_ramas', label: '🌿 Botánica Silvestre', desc: 'Siluetas botánicas lineales y finas ramas tropicales', category: 'Universal' },
];

/**
 * Retorna la URL de fondo SVG inline recoloreada según el branding de la empresa
 */
export function getPatternSvgUrl(patternId: PatternType, colorHex: string = '#FFFFFF'): string {
  const color = colorHex.startsWith('#') ? colorHex : `#${colorHex}`;
  
  let svgContent = '';

  switch (patternId) {
    case 'restaurante_general':
      svgContent = `
        <svg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='0.75' opacity='0.4'>
            <rect x='10' y='10' width='60' height='60' rx='2' />
            <rect x='20' y='20' width='40' height='40' rx='1' />
            <circle cx='40' cy='40' r='1.5' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'cafeteria':
      svgContent = `
        <svg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'>
          <g fill='${color}' opacity='0.4'>
            <path d='M15 12l4 1-2 4-2-5z' />
            <path d='M85 24l2 5-5-2 3-3z' />
            <path d='M50 78l4-3-1 6-3-3z' />
            <path d='M102 95l1 4-4-2 3-2z' />
            <rect x='30' y='45' width='3' height='3' rx='0.5' transform='rotate(45 31.5 46.5)' />
            <rect x='95' y='60' width='2' height='4' rx='0.5' transform='rotate(15 96 62)' />
            <circle cx='60' cy='15' r='1' />
            <circle cx='20' cy='90' r='1.5' />
            <circle cx='80' cy='105' r='0.8' />
            <circle cx='110' cy='40' r='1.2' />
          </g>
        </svg>
      `;
      break;

    case 'panaderia':
      svgContent = `
        <svg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='0.75' opacity='0.3'>
            <path d='M0 10l10-10M10 20l10-10M20 30l10-10M30 40l10-10M40 50l10-10M50 60l10-10' />
            <path d='M0 10l10 10M10 20l10 10M20 30l10 10M30 40l10 10M40 50l10 10M50 60l10 10' transform='scale(1, -1) translate(0, -60)' />
          </g>
        </svg>
      `;
      break;

    case 'pasteleria':
      svgContent = `
        <svg width='80' height='50' viewBox='0 0 80 50' xmlns='http://www.w3.org/2000/svg'>
          <path d='M0 50 C20 30, 20 10, 40 10 C60 10, 60 30, 80 50 M-40 50 C-20 30, -20 10, 0 10 C20 10, 20 30, 40 50' fill='none' stroke='${color}' stroke-width='0.75' opacity='0.35' />
          <path d='M0 40 C20 25, 20 15, 40 15 C60 15, 60 25, 80 40' fill='none' stroke='${color}' stroke-width='0.5' opacity='0.2' />
        </svg>
      `;
      break;

    case 'pizzeria':
      svgContent = `
        <svg width='100' height='50' viewBox='0 0 100 50' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='0.75' opacity='0.3'>
            <path d='M0 0h100v50H0z' />
            <path d='M50 0v50M25 0v25M75 0v25M25 25v25M75 25v25' />
          </g>
        </svg>
      `;
      break;

    case 'hamburgueseria':
      svgContent = `
        <svg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1.25' opacity='0.35'>
            <path d='M-10 10l20-20M10 30l20-20M30 50l20-20M50 70l20-20' />
          </g>
          <g fill='${color}' opacity='0.25'>
            <circle cx='15' cy='15' r='1' />
            <circle cx='45' cy='15' r='1' />
            <circle cx='15' cy='45' r='1' />
            <circle cx='45' cy='45' r='1' />
          </g>
        </svg>
      `;
      break;

    case 'sushi_japones':
      svgContent = `
        <svg width='120' height='40' viewBox='0 0 120 40' xmlns='http://www.w3.org/2000/svg'>
          <path d='M0 10 C30 5, 30 15, 60 10 C90 5, 90 15, 120 10' fill='none' stroke='${color}' stroke-width='0.75' opacity='0.35' />
          <path d='M0 20 C30 15, 30 25, 60 20 C90 15, 90 25, 120 20' fill='none' stroke='${color}' stroke-width='0.75' opacity='0.35' />
          <path d='M0 30 C30 25, 30 35, 60 30 C90 25, 90 35, 120 30' fill='none' stroke='${color}' stroke-width='0.75' opacity='0.35' />
        </svg>
      `;
      break;

    case 'comida_mexicana':
      svgContent = `
        <svg width='80' height='40' viewBox='0 0 80 40' xmlns='http://www.w3.org/2000/svg'>
          <path d='M0 20l20-15l20 15l20-15l20 15' fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' opacity='0.35' />
          <circle cx='20' cy='28' r='1.5' fill='${color}' opacity='0.3' />
          <circle cx='60' cy='28' r='1.5' fill='${color}' opacity='0.3' />
        </svg>
      `;
      break;

    case 'comida_italiana':
      svgContent = `
        <svg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='0.75' opacity='0.35'>
            <rect x='5' y='5' width='70' height='70' rx='2' />
            <path d='M40 5v70M5 40h70' />
            <circle cx='40' cy='40' r='12' />
            <path d='M28 28l24 24M52 28L28 52' />
          </g>
        </svg>
      `;
      break;

    case 'mariscos':
      svgContent = `
        <svg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='0.5' opacity='0.4'>
            <path d='M10 0v60M20 0v60M30 0v60M40 0v60M50 0v60' />
          </g>
        </svg>
      `;
      break;

    case 'comida_rapida':
      svgContent = `
        <svg width='90' height='52' viewBox='0 0 90 52' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='0.55' opacity='0.3'>
            <path d='M45 0L90 26L45 52L0 26Z' />
            <path d='M45 0v52M0 26h90' />
          </g>
        </svg>
      `;
      break;

    case 'comida_saludable':
      svgContent = `
        <svg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='0.75' opacity='0.3'>
            <path d='M0 50h25l10-15L50 50l15-20L80 50h20' />
            <path d='M35 35V0M65 30V0M50 50v50' />
            <circle cx='50' cy='20' r='1.5' fill='${color}' />
            <circle cx='20' cy='70' r='1.5' fill='${color}' />
            <circle cx='80' cy='70' r='1.5' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'parrilladas':
      svgContent = `
        <svg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='0.75' opacity='0.3'>
            <path d='M10 10l15 15M8 12l15 15M12 8l15 15' />
            <path d='M50 50l15 15M48 52l15 15M52 48l15 15' />
            <path d='M10 60l15-15M8 62l15-15M12 58l15-15' />
            <path d='M50 20l15-15M48 22l15-15M52 18l15-15' />
          </g>
        </svg>
      `;
      break;

    case 'bar_cocteles':
      svgContent = `
        <svg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='0.75' opacity='0.35'>
            <path d='M30 60 A30 30 0 0 1 0 30 A30 30 0 0 1 30 0 A30 30 0 0 1 60 30 A30 30 0 0 1 30 60 Z' />
            <path d='M30 60 A20 20 0 0 1 10 30 A20 20 0 0 1 30 10 A20 20 0 0 1 50 30 A20 20 0 0 1 30 60 Z' />
            <path d='M30 60 A10 10 0 0 1 20 30 A10 10 0 0 1 30 20 A10 10 0 0 1 40 30 A10 10 0 0 1 30 60 Z' />
          </g>
        </svg>
      `;
      break;

    case 'vinos':
      svgContent = `
        <svg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='0.75' opacity='0.35'>
            <circle cx='50' cy='50' r='30' />
            <circle cx='50' cy='50' r='15' />
            <circle cx='50' cy='50' r='5' />
            <path d='M50 10v10M50 80v10M10 50h10M80 50h10' />
          </g>
        </svg>
      `;
      break;

    case 'cerveceria':
      svgContent = `
        <svg width='52' height='90' viewBox='0 0 52 90' xmlns='http://www.w3.org/2000/svg'>
          <path d='M26 0 L52 15 L52 45 L26 60 L0 45 L0 15 Z M26 90 L52 75 L52 45 L26 60 L0 45 L0 75 Z' fill='none' stroke='${color}' stroke-width='0.65' opacity='0.3' />
        </svg>
      `;
      break;

    case 'heladeria_postres':
      svgContent = `
        <svg width='150' height='150' viewBox='0 0 150 150' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='0.75' opacity='0.3'>
            <path d='M0 30 C50 80, 80 20, 150 70 M0 70 C30 110, 100 50, 150 110' />
            <path d='M0 120 C60 160, 90 90, 150 140' stroke-width='0.5' opacity='0.25' />
          </g>
        </svg>
      `;
      break;

    case 'geometria_moderna':
      svgContent = `
        <svg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='0.75' opacity='0.4'>
            <path d='M30 0L60 30L30 60L0 30Z' />
            <circle cx='30' cy='30' r='1.5' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'lineas_organicas':
      svgContent = `
        <svg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'>
          <path d='M0,40 C30,20 60,60 90,40 C105,30 115,35 120,40' fill='none' stroke='${color}' stroke-width='0.75' opacity='0.35' stroke-linecap='round' />
          <path d='M0,80 C40,90 80,70 120,80' fill='none' stroke='${color}' stroke-width='0.5' opacity='0.25' stroke-linecap='round' />
        </svg>
      `;
      break;

    case 'hojas_ramas':
      svgContent = `
        <svg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='0.75' stroke-linecap='round' stroke-linejoin='round' opacity='0.35'>
            <path d='M15 85c20-20 40-10 60-30M30 70c4-4 8-2 10 2M50 50c4-4 8-2 10 2' />
          </g>
        </svg>
      `;
      break;

    default:
      svgContent = `
        <svg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'>
          <circle cx='20' cy='20' r='0.8' fill='${color}' opacity='0.35' />
        </svg>
      `;
      break;
  }

  return svgToDataUri(svgContent);
}
