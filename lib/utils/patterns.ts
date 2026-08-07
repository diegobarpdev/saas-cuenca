/**
 * Yapi.ec Pattern Registry - Hero Patterns Edition
 * Colección de texturas abstractas y geométricas premium de https://heropatterns.com/
 * Autogenerado a partir de la librería oficial de Steve Schoger.
 */

import { PatternType } from '@/lib/types/database';
export type { PatternType };

export interface PatternDefinition {
  id: PatternType;
  label: string;
  desc: string;
  category: 'Comida' | 'Bebida' | 'Dulces' | 'Universal';
}

export const PATTERNS_LIST: PatternDefinition[] = [
  { id: 'sin_patron', label: 'Sin Patrón (Sólido)', desc: 'Fondo oscuro plano y limpio sin gráficos', category: 'Universal' },
  
  // Categoría Comida (Branding Abstracto Hero Patterns)
  { id: 'restaurante_general', label: 'Formal Invitation', desc: 'Líneas decorativas y de gala clásica (Formal Invitation)', category: 'Comida' },
  { id: 'cafeteria', label: 'Texture Terrazzo', desc: 'Textura granulada mineral de roca y terrazo (Texture)', category: 'Comida' },
  { id: 'panaderia', label: 'Moroccan Tile', desc: 'Mosaico entrelazado de estilo mudéjar tradicional (Moroccan)', category: 'Comida' },
  { id: 'pasteleria', label: 'Overlapping Circles', desc: 'Patrón de círculos concéntricos traslapados (Overlapping Circles)', category: 'Comida' },
  { id: 'pizzeria', label: 'Bathroom Floor Tile', desc: 'Mosaico ortogonal geométrico limpio (Bathroom Floor)', category: 'Comida' },
  { id: 'hamburgueseria', label: 'Steel Beams Grid', desc: 'Líneas industriales cruzadas de soporte estructural (Steel Beams)', category: 'Comida' },
  { id: 'sushi_japones', label: 'Bamboo Shoji', desc: 'Estructuras de bambú oriental abstractas (Bamboo)', category: 'Comida' },
  { id: 'comida_mexicana', label: 'Aztec Chevron', desc: 'Grecas y chevrones geométricos precolombinos (Aztec)', category: 'Comida' },
  { id: 'comida_italiana', label: 'Floor Tile', desc: 'Rejilla clásica de baldosas de piedra toscana (Floor Tile)', category: 'Comida' },
  { id: 'mariscos', label: 'Creamy Wiggle', desc: 'Ríos ondulantes y corrientes marinas continuas (Wiggle)', category: 'Comida' },
  { id: 'comida_rapida', label: 'Boxes Pop Art', desc: 'Cuadrados angulares modernos de estilo pop (Boxes)', category: 'Comida' },
  { id: 'comida_saludable', label: 'Natural Leaf', desc: 'Siluetas de hojas botánicas y frescura natural (Leaf)', category: 'Comida' },
  { id: 'parrilladas', label: 'Diagonal Lines Grill', desc: 'Textura de trama lineal inclinada de barras de carbón (Diagonal Lines)', category: 'Comida' },

  // Categoría Bebida
  { id: 'bar_cocteles', label: 'Overlapping Diamonds', desc: 'Diamantes de cristal y rombos Art Deco (Overlapping Diamonds)', category: 'Bebida' },
  { id: 'vinos', label: 'Circles & Squares', desc: 'Círculos inscritos en cuadrículas de barricas (Circles & Squares)', category: 'Bebida' },
  { id: 'cerveceria', label: 'Industrial Hexagons', desc: 'Malla metálica de panal industrial limpia (Hexagons)', category: 'Bebida' },

  // Categoría Dulces
  { id: 'heladeria_postres', label: 'Overlapping Hexagons', desc: 'Malla alveolar geométrica continua y dulce (Overlapping Hexagons)', category: 'Dulces' },

  // Categoría Universal / Adicionales
  { id: 'geometria_moderna', label: 'Temple Geometry', desc: 'Trazados angulares de templos minimalistas (Temple)', category: 'Universal' },
  { id: 'lineas_organicas', label: 'Lines In Motion', desc: 'Líneas paralelas dinámicas en flujo zen (Lines In Motion)', category: 'Universal' },
];

const cleanHex = (hex: string) => (hex.includes('#') ? hex.substring(hex.indexOf('#') + 1) : hex);
const patternCache = new Map<string, string>();

export function getPatternSvgUrl(patternId: PatternType, colorHex: string = '#FFFFFF'): string {
  const color = colorHex.startsWith('#') ? colorHex : `#${colorHex}`;
  const c = cleanHex(color);
  const cacheKey = `${patternId}_${c}`;

  if (patternCache.has(cacheKey)) {
    return patternCache.get(cacheKey)!;
  }

  let result = '';
  switch (patternId) {
    case 'restaurante_general':
      return `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2218%22%20width%3D%22100%22%20viewBox%3D%220%200%20100%2018%22%3E%3Cpath%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20d%3D%22M61.82%2018c3.47-1.45%206.86-3.78%2011.3-7.34C78%206.76%2080.34%205.1%2083.87%203.42%2088.56%201.16%2093.75%200%20100%200v6.16C98.76%206.05%2097.43%206%2096%206c-9.59%200-14.23%202.23-23.13%209.34-1.28%201.03-2.39%201.9-3.4%202.66h-7.65zm-23.64%200H22.52c-1-.76-2.1-1.63-3.4-2.66C11.57%209.3%207.08%206.78%200%206.16V0c6.25%200%2011.44%201.16%2016.14%203.42%203.53%201.7%205.87%203.35%2010.73%207.24%204.45%203.56%207.84%205.9%2011.31%207.34zM61.82%200h7.66a39.57%2039.57%200%200%201-7.34%204.58C57.44%206.84%2052.25%208%2046%208S34.56%206.84%2029.86%204.58A39.57%2039.57%200%200%201%2022.52%200h15.66C41.65%201.44%2045.21%202%2050%202c4.8%200%208.35-.56%2011.82-2z%22%2F%3E%3C%2Fsvg%3E`;

    case 'cafeteria':
      return `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20width%3D%224%22%20height%3D%224%22%20viewBox%3D%220%200%204%204%22%3E%3Cpath%20d%3D%22M1%203h1v1H1V3zm2-2h1v1H3V1z%22%2F%3E%3C%2Fsvg%3E`;

    case 'panaderia':
      return `data:image/svg+xml,%3Csvg%20width%3D%2280%22%20height%3D%2288%22%20viewBox%3D%220%200%2080%2088%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctitle%3Emoroccan%3C%2Ftitle%3E%3Cpath%20d%3D%22M22%2021.91V26h-2.001C10.06%2026%202%2034.059%202%2044c0%209.943%208.058%2018%2017.999%2018H22v4.09c8.012.722%2014.785%205.738%2018%2012.73%203.212-6.991%209.983-12.008%2018-12.73V62h2.001C69.94%2062%2078%2053.941%2078%2044c0-9.943-8.058-18-17.999-18H58v-4.09c-8.012-.722-14.785-5.738-18-12.73-3.212%206.991-9.983%2012.008-18%2012.73zM54%2058v4.696c-5.574%201.316-10.455%204.428-14%208.69-3.545-4.262-8.426-7.374-14-8.69V58h-5.993C12.271%2058%206%2051.734%206%2044c0-7.732%206.275-14%2014.007-14H26v-4.696c5.574-1.316%2010.455-4.428%2014-8.69%203.545%204.262%208.426%207.374%2014%208.69V30h5.993C67.729%2030%2074%2036.266%2074%2044c0%207.732-6.275%2014-14.007%2014H54zM42%2088c0-9.941%208.061-18%2017.999-18H62v-4.09c8.016-.722%2014.787-5.738%2018-12.73v7.434c-3.545%204.262-8.426%207.374-14%208.69V74h-5.993C52.275%2074%2046%2080.268%2046%2088h-4zm-4%200c0-9.943-8.058-18-17.999-18H18v-4.09c-8.012-.722-14.785-5.738-18-12.73v7.434c3.545%204.262%208.426%207.374%2014%208.69V74h5.993C27.729%2074%2034%2080.266%2034%2088h4zm4-88c0%209.943%208.058%2018%2017.999%2018H62v4.09c8.012.722%2014.785%205.738%2018%2012.73v-7.434c-3.545-4.262-8.426-7.374-14-8.69V14h-5.993C52.271%2014%2046%207.734%2046%200h-4zM0%2034.82c3.213-6.992%209.984-12.008%2018-12.73V18h2.001C29.94%2018%2038%209.941%2038%200h-4c0%207.732-6.275%2014-14.007%2014H14v4.696c-5.574%201.316-10.455%204.428-14%208.69v7.433z%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E`;

    case 'pasteleria':
      return `data:image/svg+xml,%3Csvg%20width%3D%2280%22%20height%3D%2280%22%20viewBox%3D%220%200%2080%2080%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M50%2050c0-5.523%204.477-10%2010-10s10%204.477%2010%2010-4.477%2010-10%2010c0%205.523-4.477%2010-10%2010s-10-4.477-10-10%204.477-10%2010-10zM10%2010c0-5.523%204.477-10%2010-10s10%204.477%2010%2010-4.477%2010-10%2010c0%205.523-4.477%2010-10%2010S0%2025.523%200%2020s4.477-10%2010-10zm10%208c4.418%200%208-3.582%208-8s-3.582-8-8-8-8%203.582-8%208%203.582%208%208%208zm40%2040c4.418%200%208-3.582%208-8s-3.582-8-8-8-8%203.582-8%208%203.582%208%208%208z%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E`;

    case 'pizzeria':
      return `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2280%22%20width%3D%2280%22%20viewBox%3D%220%200%2080%2080%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20d%3D%22M0%200h40v40H0V0zm40%2040h40v40H40V40zm0-40h2l-2%202V0zm0%204l4-4h2l-6%206V4zm0%204l8-8h2L40%2010V8zm0%204L52%200h2L40%2014v-2zm0%204L56%200h2L40%2018v-2zm0%204L60%200h2L40%2022v-2zm0%204L64%200h2L40%2026v-2zm0%204L68%200h2L40%2030v-2zm0%204L72%200h2L40%2034v-2zm0%204L76%200h2L40%2038v-2zm0%204L80%200v2L42%2040h-2zm4%200L80%204v2L46%2040h-2zm4%200L80%208v2L50%2040h-2zm4%200l28-28v2L54%2040h-2zm4%200l24-24v2L58%2040h-2zm4%200l20-20v2L62%2040h-2zm4%200l16-16v2L66%2040h-2zm4%200l12-12v2L70%2040h-2zm4%200l8-8v2l-6%206h-2zm4%200l4-4v2l-2%202h-2z%22%2F%3E%3C%2Fsvg%3E`;

    case 'hamburgueseria':
      return `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2258%22%20width%3D%2242%22%20viewBox%3D%220%200%2042%2058%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20d%3D%22M12%2018h12v18h6v4H18V22h-6v-4zm-6-2v-4H0V0h36v6h6v36h-6v4h6v12H6v-6H0V16h6zM34%202H2v8h24v24h8V2zM6%208a2%202%200%201%200%200-4%202%202%200%200%200%200%204zm8%200a2%202%200%201%200%200-4%202%202%200%200%200%200%204zm8%200a2%202%200%201%200%200-4%202%202%200%200%200%200%204zm8%200a2%202%200%201%200%200-4%202%202%200%200%200%200%204zm0%208a2%202%200%201%200%200-4%202%202%200%200%200%200%204zm0%208a2%202%200%201%200%200-4%202%202%200%200%200%200%204zm0%208a2%202%200%201%200%200-4%202%202%200%200%200%200%204zM2%2050h32v-8H10V18H2v32zm28-6a2%202%200%201%200%200%204%202%202%200%200%200%200-4zm-8%200a2%202%200%201%200%200%204%202%202%200%200%200%200-4zm-8%200a2%202%200%201%200%200%204%202%202%200%200%200%200-4zm-8%200a2%202%200%201%200%200%204%202%202%200%200%200%200-4zm0-8a2%202%200%201%200%200%204%202%202%200%200%200%200-4zm0-8a2%202%200%201%200%200%204%202%202%200%200%200%200-4zm0-8a2%202%200%201%200%200%204%202%202%200%200%200%200-4z%22%2F%3E%3C%2Fsvg%3E`;

    case 'sushi_japones':
      return `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2232%22%20width%3D%2216%22%20viewBox%3D%220%200%2016%2032%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20d%3D%22M0%2024h4v2H0v-2zm0%204h6v2H0v-2zm0-8h2v2H0v-2zM0%200h4v2H0V0zm0%204h2v2H0V4zm16%2020h-6v2h6v-2zm0%204H8v2h8v-2zm0-8h-4v2h4v-2zm0-20h-6v2h6V0zm0%204h-4v2h4V4zm-2%2012h2v2h-2v-2zm0-8h2v2h-2V8zM2%208h10v2H2V8zm0%208h10v2H2v-2zm-2-4h14v2H0v-2zm4-8h6v2H4V4zm0%2016h6v2H4v-2zM6%200h2v2H6V0zm0%2024h2v2H6v-2z%22%2F%3E%3C%2Fsvg%3E`;

    case 'comida_mexicana':
      return `data:image/svg+xml,%3Csvg%20width%3D%2232%22%20height%3D%2264%22%20viewBox%3D%220%200%2032%2064%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctitle%3Eaztec%3C%2Ftitle%3E%3Cpath%20d%3D%22M0%2028h20V16h-4v8H4V4h28v28h-4V8H8v12h4v-8h12v20H0v-4zm12%208h20v4H16v24H0v-4h12V36zm16%2012h-4v12h8v4H20V44h12v12h-4v-8zM0%2036h8v20H0v-4h4V40H0v-4z%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E`;

    case 'comida_italiana':
      return `data:image/svg+xml,%3Csvg%20width%3D%2230%22%20height%3D%2230%22%20viewBox%3D%220%200%2030%2030%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctitle%3Efloor-tile%3C%2Ftitle%3E%3Cpath%20d%3D%22M0%2010h10v10H0V10zM10%200h10v10H10V0z%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E`;

    case 'mariscos':
      return `data:image/svg+xml,%3Csvg%20width%3D%2252%22%20height%3D%2226%22%20viewBox%3D%220%200%2052%2026%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M10%2010c0-2.21-1.79-4-4-4-3.314%200-6-2.686-6-6h2c0%202.21%201.79%204%204%204%203.314%200%206%202.686%206%206%200%202.21%201.79%204%204%204%203.314%200%206%202.686%206%206%200%202.21%201.79%204%204%204v2c-3.314%200-6-2.686-6-6%200-2.21-1.79-4-4-4-3.314%200-6-2.686-6-6zm25.464-1.95l8.486%208.486-1.414%201.414-8.486-8.486%201.414-1.414z%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E`;

    case 'comida_rapida':
      return `data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctitle%3Ebozes%3C%2Ftitle%3E%3Cpath%20d%3D%22M0%200h20L0%2020z%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E`;

    case 'comida_saludable':
      return `data:image/svg+xml,%3Csvg%20width%3D%2280%22%20height%3D%2240%22%20viewBox%3D%220%200%2080%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctitle%3Eleaf%3C%2Ftitle%3E%3Cg%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M2.011%2039.976c.018-4.594%201.785-9.182%205.301-12.687.475-.474.97-.916%201.483-1.326v9.771L4.54%2039.976H2.01zm5.373%200L23.842%2023.57c.687%205.351-1.031%2010.95-5.154%2015.06-.483.483-.987.931-1.508%201.347H7.384zm-7.384%200c.018-5.107%201.982-10.208%205.89-14.104%205.263-5.247%2012.718-6.978%2019.428-5.192%201.783%206.658.07%2014.053-5.137%2019.296H.001zm10.806-15.41c3.537-2.116%207.644-2.921%2011.614-2.415L10.806%2033.73v-9.163zM65.25.75C58.578-1.032%2051.164.694%2045.93%205.929c-5.235%205.235-6.961%2012.649-5.18%2019.321%206.673%201.782%2014.087.056%2019.322-5.179%205.235-5.235%206.961-12.649%205.18-19.321zM43.632%2023.783c5.338.683%2010.925-1.026%2015.025-5.126%204.1-4.1%205.809-9.687%205.126-15.025l-20.151%2020.15zm7.186-19.156c3.518-2.112%207.602-2.915%2011.55-2.41l-11.55%2011.55v-9.14zm-3.475%202.716c-4.1%204.1-5.809%209.687-5.126%2015.025l6.601-6.6V6.02c-.51.41-1.002.85-1.475%201.323zM.071%200C.065%201.766.291%203.533.75%205.25%207.422%207.032%2014.836%205.306%2020.07.071l.07-.071H.072zm17.086%200C13.25%203.125%208.345%204.386%203.632%203.783L7.414%200h9.743zM2.07%200c-.003.791.046%201.582.146%202.368L4.586%200H2.07z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E`;

    case 'parrilladas':
      return `data:image/svg+xml,%3Csvg%20width%3D%226%22%20height%3D%226%22%20viewBox%3D%220%200%206%206%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctitle%3EArtboard%203%20Copy%202%3C%2Ftitle%3E%3Cg%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M5%200h1L0%206V5zM6%205v1H5z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E`;

    case 'bar_cocteles':
      return `data:image/svg+xml,%3Csvg%20width%3D%2248%22%20height%3D%2264%22%20viewBox%3D%220%200%2048%2064%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctitle%3Eoverlapping-diamonds%3C%2Ftitle%3E%3Cpath%20d%3D%22M48%2028v-4L36%2012%2024%2024%2012%2012%200%2024v4l4%204-4%204v4l12%2012%2012-12%2012%2012%2012-12v-4l-4-4%204-4zM8%2032l-6-6%2010-10%2010%2010-6%206%206%206-10%2010L2%2038l6-6zm12%200l4-4%204%204-4%204-4-4zm12%200l-6-6%2010-10%2010%2010-6%206%206%206-10%2010-10-10%206-6zM0%2016L10%206%204%200h4l4%204%204-4h4l-6%206%2010%2010L34%206l-6-6h4l4%204%204-4h4l-6%206%2010%2010v4L36%208%2024%2020%2012%208%200%2020v-4zm0%2032l10%2010-6%206h4l4-4%204%204h4l-6-6%2010-10%2010%2010-6%206h4l4-4%204%204h4l-6-6%2010-10v-4L36%2056%2024%2044%2012%2056%200%2044v4z%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E`;

    case 'vinos':
      return `data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctitle%3Ecircle-squares%3C%2Ftitle%3E%3Cpath%20d%3D%22M0%200h20v20H0V0zm10%2017c3.866%200%207-3.134%207-7s-3.134-7-7-7-7%203.134-7%207%203.134%207%207%207zm20%200c3.866%200%207-3.134%207-7s-3.134-7-7-7-7%203.134-7%207%203.134%207%207%207zM10%2037c3.866%200%207-3.134%207-7s-3.134-7-7-7-7%203.134-7%207%203.134%207%207%207zm10-17h20v20H20V20zm10%2017c3.866%200%207-3.134%207-7s-3.134-7-7-7-7%203.134-7%207%203.134%207%207%207z%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E`;

    case 'cerveceria':
      return `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2228%22%20height%3D%2249%22%20viewBox%3D%220%200%2028%2049%22%3E%3Cpath%20d%3D%22M13.99%209.25l13%207.5v15l-13%207.5L1%2031.75v-15l12.99-7.5zM3%2017.9v12.7l10.99%206.34%2011-6.35V17.9l-11-6.34L3%2017.9zM0%2015l12.98-7.5V0h-2v6.35L0%2012.69v2.3zm0%2018.5L12.98%2041v8h-2v-6.85L0%2035.81v-2.3zM15%200v7.5L27.99%2015H28v-2.31h-.01L17%206.35V0h-2zm0%2049v-8l12.99-7.5H28v2.31h-.01L17%2042.15V49h-2z%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20fill-rule%3D%22nonzero%22%2F%3E%3C%2Fsvg%3E`;

    case 'heladeria_postres':
      return `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2250%22%20height%3D%2240%22%20viewBox%3D%220%200%2050%2040%22%3E%3Cpath%20d%3D%22M40%2010L36.67%200h-2.11l3.33%2010H20l-2.28%206.84L12.11%200H10l6.67%2020H10l-2.28%206.84L2.11%2010%205.44%200h-2.1L0%2010l6.67%2020-3.34%2010h2.11l2.28-6.84L10%2040h20l2.28-6.84L34.56%2040h2.1l-3.33-10H40l2.28-6.84L47.89%2040H50l-6.67-20L50%200h-2.1l-5.62%2016.84L40%2010zm1.23%2010l-2.28-6.84L34%2028h4.56l2.67-8zm-10.67%208l-2-6h-9.12l2%206h9.12zm-12.84-4.84L12.77%2038h15.79l2.67-8H20l-2.28-6.84zM18.77%2020H30l2.28%206.84L37.23%2012H21.44l-2.67%208zm-7.33%202H16l-4.95%2014.84L8.77%2030l2.67-8z%22%20fill-rule%3D%22evenodd%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%2F%3E%3C%2Fsvg%3E`;

    case 'geometria_moderna':
      return `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22152%22%20height%3D%22152%22%20viewBox%3D%220%200%20152%20152%22%3E%3Cpath%20d%3D%22M152%20150v2H0v-2h28v-8H8v-20H0v-2h8V80h42v20h20v42H30v8h90v-8H80v-42h20V80h42v40h8V30h-8v40h-42V50H80V8h40V0h2v8h20v20h8V0h2v150zm-2%200v-28h-8v20h-20v8h28zM82%2030v18h18V30H82zm20%2018h20v20h18V30h-20V10H82v18h20v20zm0%202v18h18V50h-18zm20-22h18V10h-18v18zm-54%2092v-18H50v18h18zm-20-18H28V82H10v38h20v20h38v-18H48v-20zm0-2V82H30v18h18zm-20%2022H10v18h18v-18zm54%200v18h38v-20h20V82h-18v20h-20v20H82zm18-20H82v18h18v-18zm2-2h18V82h-18v18zm20%2040v-18h18v18h-18zM30%200h-2v8H8v20H0v2h8v40h42V50h20V8H30V0zm20%2048h18V30H50v18zm18-20H48v20H28v20H10V30h20V10h38v18zM30%2050h18v18H30V50zm-2-40H10v18h18V10z%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E`;

    case 'lineas_organicas':
      return `data:image/svg+xml,%3Csvg%20width%3D%22120%22%20height%3D%22120%22%20viewBox%3D%220%200%20120%20120%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctitle%3Eline-in-motion%3C%2Ftitle%3E%3Cpath%20d%3D%22M9%200h2v20H9V0zm25.134.84l1.732%201-10%2017.32-1.732-1%2010-17.32zm-20%2020l1.732%201-10%2017.32-1.732-1%2010-17.32zM58.16%204.134l1%201.732-17.32%2010-1-1.732%2017.32-10zm-40%2040l1%201.732-17.32%2010-1-1.732%2017.32-10zM80%209v2H60V9h20zM20%2069v2H0v-2h20zm79.32-55l-1%201.732-17.32-10L82%204l17.32%2010zm-80%2080l-1%201.732-17.32-10L2%2084l17.32%2010zm96.546-75.84l-1.732%201-10-17.32%201.732-1%2010%2017.32zm-100%20100l-1.732%201-10-17.32%201.732-1%2010%2017.32zM38.16%2024.134l1%201.732-17.32%2010-1-1.732%2017.32-10zM60%2029v2H40v-2h20zm19.32%205l-1%201.732-17.32-10L62%2024l17.32%2010zm16.546%204.16l-1.732%201-10-17.32%201.732-1%2010%2017.32zM111%2040h-2V20h2v20zm3.134.84l1.732%201-10%2017.32-1.732-1%2010-17.32zM40%2049v2H20v-2h20zm19.32%205l-1%201.732-17.32-10L42%2044l17.32%2010zm16.546%204.16l-1.732%201-10-17.32%201.732-1%2010%2017.32zM91%2060h-2V40h2v20zm3.134.84l1.732%201-10%2017.32-1.732-1%2010-17.32zm24.026%203.294l1%201.732-17.32%2010-1-1.732%2017.32-10zM39.32%2074l-1%201.732-17.32-10L22%2064l17.32%2010zm16.546%204.16l-1.732%201-10-17.32%201.732-1%2010%2017.32zM71%2080h-2V60h2v20zm3.134.84l1.732%201-10%2017.32-1.732-1%2010-17.32zm24.026%203.294l1%201.732-17.32%2010-1-1.732%2017.32-10zM120%2089v2h-20v-2h20zm-84.134%209.16l-1.732%201-10-17.32%201.732-1%2010%2017.32zM51%20100h-2V80h2v20zm3.134.84l1.732%201-10%2017.32-1.732-1%2010-17.32zm24.026%203.294l1%201.732-17.32%2010-1-1.732%2017.32-10zM100%20109v2H80v-2h20zm19.32%205l-1%201.732-17.32-10%201-1.732%2017.32%2010zM31%20120h-2v-20h2v20z%22%20fill%3D%22%23${c}%22%20fill-opacity%3D%221%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E`;

    default:
      // Fallback a un patrón neutro de puntos sutiles
      result = `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='1' fill='%23${c}' fill-opacity='0.5'/%3E%3C/svg%3E`;
  }

  patternCache.set(cacheKey, result);
  return result;
}
