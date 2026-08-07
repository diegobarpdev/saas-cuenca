/**
 * Yapi.ec Pattern Registry
 * Colección de patrones vectoriales (seamless/tileables) premium y minimalistas para fondos de catálogos.
 * Diseñados con espacio negativo abundante y trazos limpios de baja densidad para legibilidad perfecta.
 */

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

import { PatternType } from '@/lib/types/database';
export type { PatternType };

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
  
  // Categoría Comida
  { id: 'restaurante_general', label: '🍽️ Restaurante General', desc: 'Cubiertos cruzados, estrellas y campana gourmet', category: 'Comida' },
  { id: 'cafeteria', label: '☕ Cafetería & Café', desc: 'Granos de café seleccionados y tazas humeantes', category: 'Comida' },
  { id: 'panaderia', label: '🥐 Panadería & Trigo', desc: 'Espigas de trigo, croissants y pan artesanal', category: 'Comida' },
  { id: 'pasteleria', label: '🧁 Pastelería & Tortas', desc: 'Cupcakes de fresa, batidoras y cerezas', category: 'Comida' },
  { id: 'pizzeria', label: '🍕 Pizzería Italiana', desc: 'Rebanadas de pizza, rodillos y hojas de albahaca', category: 'Comida' },
  { id: 'hamburgueseria', label: '🍔 Hamburguesería', desc: 'Hamburguesas, vasos de soda y papas fritas', category: 'Comida' },
  { id: 'sushi_japones', label: '🥢 Sushi & Ramen', desc: 'Rollos de sushi maki, palillos y tazones de sopa', category: 'Comida' },
  { id: 'comida_mexicana', label: '🌮 Comida Mexicana', desc: 'Tacos crujientes, chiles jalapeños y cactus', category: 'Comida' },
  { id: 'comida_italiana', label: '🍝 Pasta & Tomates', desc: 'Tenedor con pasta enrollada, ajos y tomates', category: 'Comida' },
  { id: 'mariscos', label: '🐟 Mariscos & Pesca', desc: 'Siluetas de peces, camarones y anclas marinas', category: 'Comida' },
  { id: 'comida_rapida', label: '🍟 Fast Food Express', desc: 'Hot dogs, gaseosas, burgers y papas para llevar', category: 'Comida' },
  { id: 'comida_saludable', label: '🥑 Saludable & Vegano', desc: 'Aguacates cortados, brócolis y hojas verdes', category: 'Comida' },
  { id: 'parrilladas', label: '🥩 Parrilla & Carnes', desc: 'Cortes de carne (T-Bone), parrillas y pinzas', category: 'Comida' },

  // Categoría Bebida
  { id: 'bar_cocteles', label: '🍹 Copas & Coctelería', desc: 'Copas Martini, shakers y rodajas de limón', category: 'Bebida' },
  { id: 'vinos', label: '🍷 Vinos & Viñedos', desc: 'Botellas de vino, copas y racimos de uva', category: 'Bebida' },
  { id: 'cerveceria', label: '🍺 Cervecería Artesanal', desc: 'Chopps espumosos, flores de lúpulo y tapas', category: 'Bebida' },

  // Categoría Dulces
  { id: 'heladeria_postres', label: '🍦 Helados & Dulces', desc: 'Barquillos, paletas heladas y cerezas', category: 'Dulces' },

  // Categoría Universal / Texturas
  { id: 'geometria_moderna', label: '🔶 Geometría Moderna', desc: 'Mosaico sutil de rombos y puntos continuos', category: 'Universal' },
  { id: 'lineas_organicas', label: '🌀 Líneas Orgánicas', desc: 'Ondas suaves continuas estilo trazo zen', category: 'Universal' },
  { id: 'hojas_ramas', label: '🌿 Hojas & Botánica', desc: 'Follaje minimalista de hojas tropicales y ramas', category: 'Universal' },
];

/**
 * Retorna la URL de fondo SVG inline recoloreada según el branding de la empresa
 */
export function getPatternSvgUrl(patternId: PatternType, colorHex: string = '#FFFFFF'): string {
  // Asegurar formato de color
  const color = colorHex.startsWith('#') ? colorHex : `#${colorHex}`;
  
  let svgContent = '';

  switch (patternId) {
    case 'restaurante_general':
      svgContent = `
        <svg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Cubiertos cruzados -->
            <path d='M25 25l10 10M35 25l-10 10M30 22v6M85 85l10 10M95 85l-10 10M90 82v6' />
            <!-- Campana gourmet gourmet -->
            <path d='M85 28c0-5 3-7 5-7s5 2 5 7h-10zM82 32h16c0-3-2-4-8-4s-8 1-8 4z' />
            <circle cx='90' cy='34' r='1' />
            <!-- Estrella minimalista -->
            <path d='M28 88l2 4 4 2-4 2-2 4-2-4-4-2 4-2z' />
            <!-- Pequeños puntos de relleno -->
            <circle cx='60' cy='30' r='1.5' fill='${color}' />
            <circle cx='60' cy='90' r='1.5' fill='${color}' />
            <circle cx='20' cy='60' r='1' fill='${color}' />
            <circle cx='100' cy='60' r='1' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'cafeteria':
      svgContent = `
        <svg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round'>
            <!-- Taza de Café -->
            <path d='M22 24h12c0 6-3 9-6 9s-6-3-6-9z' />
            <path d='M34 26h2c1 0 2 1 2 2s-1 2-2 2h-2' />
            <path d='M24 20c1-2 1-2 2-2M30 20c1-2 1-2 2-2' />
            <!-- Grano de café -->
            <path d='M70 70c4-4 8-4 8 0s-4 8-8 8-8 4-8 0 4-8 8-8z' />
            <path d='M63 78c3-3 5-5 9-9' />
            <!-- Grano flotante chico -->
            <path d='M28 72c2-2 4-2 4 0s-2 4-4 4-4 2-4 0 2-4 4-4z' />
            <!-- Vapor o aroma minimal -->
            <path d='M72 22c2-2 2-3 2-5M76 21c1-1 1-3 1-4' />
            <circle cx='75' cy='28' r='1' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'panaderia':
      svgContent = `
        <svg width='130' height='130' viewBox='0 0 130 130' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Trigo -->
            <path d='M30 25v30M27 28c1-1 3-1 3 2M33 30c-1-1-3-1-3 2M26 34c1-1 3-1 3 2M34 36c-1-1-3-1-3 2M27 42c1-1 3-1 3 2' />
            <!-- Croissant -->
            <path d='M95 90c-5-5-15 0-20-5s0-15-5-20c3 3 8 13 13 13s10-2 12-4c2 2-2 7-2 12s10 10 13 13c-5-5-6-4-11-9z' />
            <!-- Pan baguette mini -->
            <path d='M85 30l15 15M88 33l2-2M92 37l2-2M96 41l2-2' />
            <!-- Harina/Puntos -->
            <circle cx='35' cy='90' r='1' fill='${color}' />
            <circle cx='40' cy='85' r='1.5' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'pasteleria':
      svgContent = `
        <svg width='110' height='110' viewBox='0 0 110 110' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Cupcake -->
            <path d='M25 35h16l-3 10H28l-3-10z' />
            <path d='M23 35c0-4 4-6 10-6s10 2 10 6' />
            <!-- Cereza -->
            <circle cx='33' cy='22' r='2' fill='${color}' />
            <path d='M33 20c2-4 5-4 7-2' />
            <!-- Rodillo o Batidor -->
            <path d='M85 85l10-10M88 82l2 2' />
            <circle cx='80' cy='80' r='1' fill='${color}' />
            <!-- Chispas -->
            <path d='M80 30h3M85 27v3M30 85h2' />
          </g>
        </svg>
      `;
      break;

    case 'pizzeria':
      svgContent = `
        <svg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Rebanada de Pizza -->
            <path d='M30 20l25 30c-2 2-6 2-10 0s-4-6-6-8c-2-2-7-2-9-2L30 20z' />
            <!-- Peperoni -->
            <circle cx='37' cy='28' r='1.5' fill='${color}' />
            <circle cx='44' cy='36' r='1.5' fill='${color}' />
            <!-- Albahaca -->
            <path d='M85 85c2-4 6-4 8 0s-2 6-8 0z' />
            <!-- Champiñón -->
            <path d='M82 32c0-3 3-5 5-5s5 2 5 7H82z' />
            <path d='M87 34v4' />
          </g>
        </svg>
      `;
      break;

    case 'hamburgueseria':
      svgContent = `
        <svg width='110' height='110' viewBox='0 0 110 110' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Hamburguesa -->
            <path d='M25 30h20c0-6-4-8-10-8s-10 2-10 8z' />
            <path d='M23 34h24M25 38h20c0 4-4 6-10 6s-10-2-10-6z' />
            <!-- Papas fritas -->
            <path d='M80 88h12l-2-12H82l-2 12zM82 76v-6M86 76v-8M90 76v-6' />
            <circle cx='80' cy='25' r='1' fill='${color}' />
            <circle cx='30' cy='85' r='1' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'sushi_japones':
      svgContent = `
        <svg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Sushi Maki -->
            <ellipse cx='30' cy='30' rx='10' ry='5' />
            <ellipse cx='30' cy='30' rx='5' ry='2' fill='${color}' />
            <path d='M20 30v8c0 3 4 5 10 5s10-2 10-5v-8' />
            <!-- Palillos -->
            <path d='M65 80l22-22M69 82l22-18' />
            <circle cx='70' cy='25' r='1.5' fill='${color}' />
            <circle cx='30' cy='75' r='1' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'comida_mexicana':
      svgContent = `
        <svg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Taco -->
            <path d='M22 36c0-8 6-12 14-12s14 4 14 12H22z' />
            <path d='M20 36c2-4 6-6 10-6s8 2 10 6M38 36c1-3 4-5 7-2' />
            <!-- Chile Jalapeño -->
            <path d='M85 82c3-4 6-2 8 2s-3 6-8 6' />
            <path d='M85 82c-2-2-4-2-5 0' />
            <!-- Cactus -->
            <path d='M35 88v12M32 92c0-2-3-2-3 0v4c0 1 2 2 3 0M38 94c0-2 3-2 3 0v2c0 1-2 2-3 0' />
          </g>
        </svg>
      `;
      break;

    case 'comida_italiana':
      svgContent = `
        <svg width='110' height='110' viewBox='0 0 110 110' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Tenedor con Pasta -->
            <path d='M30 45V22M27 22v6c0 2 2 3 3 3s3-1 3-3v-6M24 22v3c0 2 1 3 2 3' />
            <!-- Pasta enrollada abstracta -->
            <path d='M21 28c4-1 6 3 9 3s5-3 8-1' />
            <!-- Tomate -->
            <circle cx='85' cy='85' r='8' />
            <path d='M83 77c1-1 3-1 4 0' fill='${color}' />
            <circle cx='85' cy='30' r='1' fill='${color}' />
            <circle cx='30' cy='85' r='1.5' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'mariscos':
      svgContent = `
        <svg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Pez minimalista -->
            <path d='M20 30c5-5 12-5 17-2 3-3 8-3 11 0l3 4c-5 0-9 2-12 5-3-2-7-3-11-2l-8-5z' />
            <path d='M48 32l6-4v8z' />
            <circle cx='25' cy='28' r='1' fill='${color}' />
            <!-- Ancla marina -->
            <path d='M90 76v14M85 85c0 5 10 5 10 0M87 78h6' />
            <circle cx='90' cy='75' r='2' />
          </g>
        </svg>
      `;
      break;

    case 'comida_rapida':
      svgContent = `
        <svg width='130' height='130' viewBox='0 0 130 130' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Hot Dog -->
            <path d='M22 36c4-4 16-4 20 0s-4 16-20 20c-4-4-4-16 0-20z' fill='none' />
            <path d='M20 38c5-3 12-3 16 0' />
            <!-- Bebida con sorbete -->
            <path d='M85 90h12l-2-16H87l-2 16zM91 74v-8l-3-2' />
            <circle cx='90' cy='30' r='1.5' fill='${color}' />
            <circle cx='35' cy='90' r='1' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'comida_saludable':
      svgContent = `
        <svg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Aguacate -->
            <path d='M25 28c3-6 10-6 12-2s5 10 3 14c-3 3-9 3-12 0s-6-6-3-12z' />
            <circle cx='30' cy='32' r='3' fill='${color}' />
            <!-- Hoja -->
            <path d='M75 75c2-6 6-6 8 0s-2 6-8 0z' />
            <path d='M75 75l4-4' />
            <!-- Puntos de frescura -->
            <circle cx='70' cy='25' r='1' fill='${color}' />
            <circle cx='30' cy='75' r='1.5' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'parrilladas':
      svgContent = `
        <svg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Filete con hueso (T-Bone) -->
            <path d='M25 35c6-6 18-3 20 5s-6 15-14 15c-6 0-12-6-12-12s3-11 6-8z' />
            <path d='M35 35c2 0 4 2 2 4s-4 0-2-4z' fill='${color}' />
            <!-- Parrilla llama -->
            <path d='M85 85c0 5 10 5 10 0M82 82h16M87 88v4M93 88v4' />
            <path d='M88 78c1-2 2-2 2 0M92 78c1-2 2-2 2 0' />
          </g>
        </svg>
      `;
      break;

    case 'bar_cocteles':
      svgContent = `
        <svg width='110' height='110' viewBox='0 0 110 110' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Copa de Cóctel -->
            <path d='M25 25h20L35 38v10M31 48h8' />
            <!-- Aceituna -->
            <circle cx='35' cy='28' r='1.5' fill='${color}' />
            <path d='M38 23l-5 8' />
            <!-- Shaker coctelera -->
            <path d='M80 88l6-16M80 72h6M81 72l2-4h2l2 4' />
            <circle cx='80' cy='30' r='1.5' fill='${color}' />
            <circle cx='30' cy='85' r='1' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'vinos':
      svgContent = `
        <svg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Botella de Vino -->
            <path d='M28 42h8v-8h-8v8zM26 42c0 2 1 3 3 3h6c2 0 3-1 3-3v14H26V42z' />
            <!-- Copa de Vino -->
            <path d='M85 85c0 4 3 6 5 6s5-2 5-6v6M88 91v6M86 97h8' />
            <!-- Racimo de uva -->
            <circle cx='30' cy='85' r='2' fill='${color}' />
            <circle cx='34' cy='85' r='2' fill='${color}' />
            <circle cx='32' cy='89' r='2' fill='${color}' />
            <circle cx='90' cy='30' r='1.5' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'cerveceria':
      svgContent = `
        <svg width='110' height='110' viewBox='0 0 110 110' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Jarra de Cerveza -->
            <path d='M25 32h14v18c0 3-2 5-5 5h-4c-3 0-5-2-5-5V32z' />
            <path d='M39 36h3c1 0 2 1 2 2v6c0 1-1 2-2 2h-3' />
            <!-- Espuma humeante -->
            <path d='M23 32c0-3 4-5 8-3s8 0 8 3H23z' fill='${color}' />
            <!-- Lúpulo -->
            <path d='M85 85c2-3 4-1 4 2s-2 4-4 2-4 1-4-2 2-5 4-2z' />
            <circle cx='80' cy='30' r='1.5' fill='${color}' />
            <circle cx='30' cy='85' r='1' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'heladeria_postres':
      svgContent = `
        <svg width='110' height='110' viewBox='0 0 110 110' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Helado de Cono -->
            <path d='M25 28c0-5 5-7 8-7s8 2 8 7H25z' />
            <path d='M25 28l8 16 8-16H25z' />
            <!-- Helado de paleta -->
            <path d='M80 80h10v10H80zM82 80v-8c0-2 2-4 3-4s3 2 3 4v8' />
            <circle cx='85' cy='25' r='1.5' fill='${color}' />
            <circle cx='30' cy='85' r='1' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'geometria_moderna':
      svgContent = `
        <svg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' opacity='0.75'>
            <path d='M30 0L60 30L30 60L0 30Z' />
            <circle cx='30' cy='30' r='2' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    case 'lineas_organicas':
      svgContent = `
        <svg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'>
          <path d='M0,40 C30,20 60,60 90,40 C105,30 115,35 120,40' fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' />
          <path d='M0,80 C40,90 80,70 120,80' fill='none' stroke='${color}' stroke-width='0.75' stroke-linecap='round' />
        </svg>
      `;
      break;

    case 'hojas_ramas':
      svgContent = `
        <svg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='${color}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>
            <!-- Rama con hojas a la izquierda -->
            <path d='M25 45c10-5 15-15 20-20M30 40c2-4 6-4 8 0M38 33c3-3 6-1 5 3' />
            <!-- Monstruosa hoja tropical a la derecha -->
            <path d='M85 85c2-6 8-8 12-4s1 10-4 12c-4 2-10 0-12-4z' />
            <path d='M85 85l6 6' />
            <circle cx='30' cy='85' r='1' fill='${color}' />
            <circle cx='85' cy='30' r='1' fill='${color}' />
          </g>
        </svg>
      `;
      break;

    default:
      // Fallback a un patrón neutro de puntos sutiles
      svgContent = `
        <svg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'>
          <circle cx='20' cy='20' r='1' fill='${color}' />
        </svg>
      `;
      break;
  }

  return svgToDataUri(svgContent);
}
