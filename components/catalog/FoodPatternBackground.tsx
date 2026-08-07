'use client';

import React from 'react';
import { PatternType, getPatternSvgUrl } from '@/lib/utils/patterns';

interface FoodPatternBackgroundProps {
  pattern?: PatternType;
  color?: string;
}

export const FoodPatternBackground = React.memo(function FoodPatternBackground({
  pattern = 'sin_patron',
  color = '#ffffff',
}: FoodPatternBackgroundProps) {
  if (!pattern || pattern === 'sin_patron') {
    return null;
  }

  const patternUrl = getPatternSvgUrl(pattern, color);

  if (!patternUrl) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden transform-gpu [transform:translateZ(0)] [contain:strict] [will-change:transform]"
    >
      {/* Fondo Texturizado con Aislamiento GPU total */}
      <div
        className="absolute inset-0 opacity-[0.04] transform-gpu [transform:translateZ(0)] [contain:paint]"
        style={{
          backgroundImage: `url("${patternUrl}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '180px auto',
        }}
      ></div>
      {/* Resplandores Ambientales de Acompañamiento */}
      <div className="absolute -top-24 left-1/4 w-[350px] sm:w-[450px] h-[350px] sm:h-[450px] bg-amber-500/5 rounded-full blur-[100px] sm:blur-[130px] transform-gpu"></div>
      <div className="absolute top-1/2 right-10 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-emerald-500/5 rounded-full blur-[120px] sm:blur-[150px] transform-gpu"></div>
    </div>
  );
});
