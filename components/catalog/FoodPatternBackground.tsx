'use client';

import React, { useEffect, useRef } from 'react';
import { PatternType, getPatternSvgUrl } from '@/lib/utils/patterns';

interface FoodPatternBackgroundProps {
  pattern?: PatternType;
  color?: string;
}

export const FoodPatternBackground = React.memo(function FoodPatternBackground({
  pattern = 'sin_patron',
  color = '#ffffff',
}: FoodPatternBackgroundProps) {
  const patternRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Parallax solo en desktop (sin efecto en móvil para no afectar el rendimiento táctil)
    const isMobile = () => window.innerWidth < 768;

    const handleScroll = () => {
      if (isMobile() || !patternRef.current) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!patternRef.current) return;
        // Factor 0.25 = el fondo se mueve al 25% de la velocidad del scroll (efecto parallax suave)
        const y = window.scrollY * 0.25;
        patternRef.current.style.transform = `translateY(${y}px) translateZ(0)`;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!pattern || pattern === 'sin_patron') {
    return null;
  }

  const patternUrl = getPatternSvgUrl(pattern, color);

  if (!patternUrl) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* Capa de patrón con parallax - se extiende 40% más de la altura para cubrir el desplazamiento */}
      <div
        ref={patternRef}
        className="absolute inset-x-0 -top-[20%] h-[140%] [will-change:transform]"
        style={{ transform: 'translateZ(0)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: `url("${patternUrl}")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '180px auto',
          }}
        />
        {/* Resplandores Ambientales */}
        <div className="absolute top-[15%] left-1/4 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-amber-500/5 rounded-full blur-[100px] sm:blur-[140px]" />
        <div className="absolute top-[55%] right-10 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-brand-500/5 rounded-full blur-[120px] sm:blur-[160px]" />
      </div>
    </div>
  );
});
