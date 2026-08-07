'use client';

import React, { useEffect, useRef } from 'react';
import { PatternType, getPatternSvgUrl } from '@/lib/utils/patterns';

interface FoodPatternBackgroundProps {
  pattern?: PatternType;
  color?: string;
}

export const FoodPatternBackground = React.memo(function FoodPatternBackground({
  pattern = 'ondas_fluidas',
  color = '#ffffff',
}: FoodPatternBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (pattern !== 'ondas_fluidas') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    let step = 0;
    let isTabVisible = true;
    const handleVisibilityChange = () => {
      isTabVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (isTabVisible) {
        step += 0.004;
        ctx.clearRect(0, 0, width, height);

        // Líneas Curvas Orgánicas Fluídas
        const waveConfigs = [
          {
            color: 'rgba(245, 158, 11, 0.12)',
            lineWidth: 2.5,
            speed: 1,
            amplitude: 60,
            frequency: 0.003,
            yOffset: height * 0.25,
          },
          {
            color: 'rgba(16, 185, 129, 0.09)',
            lineWidth: 2,
            speed: 1.3,
            amplitude: 80,
            frequency: 0.002,
            yOffset: height * 0.45,
          },
          {
            color: 'rgba(244, 63, 94, 0.07)',
            lineWidth: 1.8,
            speed: 0.8,
            amplitude: 70,
            frequency: 0.0025,
            yOffset: height * 0.65,
          },
          {
            color: 'rgba(56, 189, 248, 0.08)',
            lineWidth: 2.2,
            speed: 1.1,
            amplitude: 50,
            frequency: 0.0035,
            yOffset: height * 0.82,
          },
        ];

        waveConfigs.forEach((wave) => {
          ctx.beginPath();
          ctx.lineWidth = wave.lineWidth;
          ctx.strokeStyle = wave.color;

          for (let x = 0; x <= width; x += 25) {
            const y =
              wave.yOffset +
              Math.sin(x * wave.frequency + step * wave.speed) * wave.amplitude +
              Math.cos(x * 0.001 + step * 0.5) * (wave.amplitude * 0.4);

            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.stroke();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [pattern]);

  if (pattern === 'sin_patron') {
    return null;
  }

  const isCustomSvgPattern = ![
    'ondas_fluidas',
    'malla_aurora',
    'lineas_geomets',
    'degradado_luxe',
    'sin_patron',
  ].includes(pattern);

  const patternUrl = isCustomSvgPattern ? getPatternSvgUrl(pattern, color) : '';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden transform-gpu [transform:translateZ(0)] [contain:strict] [will-change:transform]"
    >
      {/* 1. Opción: Ondas Curvas Orgánicas Animadas */}
      {pattern === 'ondas_fluidas' && (
        <>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-90 hidden md:block" />
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.07] mix-blend-screen"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 900"
            preserveAspectRatio="none"
          >
            <path
              d="M0,192C280,290,420,120,720,210C1020,300,1200,150,1440,240L1440,0L0,0Z"
              fill="url(#grad1)"
            />
            <path
              d="M0,450C320,380,540,520,880,430C1180,340,1320,480,1440,410L1440,0L0,0Z"
              fill="url(#grad2)"
            />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute -top-24 left-1/4 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-amber-500/10 rounded-full blur-[100px] sm:blur-[150px] transform-gpu"></div>
          <div className="absolute top-1/2 -right-24 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-emerald-500/8 rounded-full blur-[120px] sm:blur-[180px] transform-gpu"></div>
        </>
      )}

      {/* 2. Opción: Malla Aurora Resplandor Difuso */}
      {pattern === 'malla_aurora' && (
        <>
          <div className="absolute -top-32 left-1/3 w-[450px] sm:w-[600px] h-[450px] sm:h-[600px] bg-amber-500/15 rounded-full blur-[120px] sm:blur-[160px] transform-gpu"></div>
          <div className="absolute top-1/2 -right-32 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-emerald-500/12 rounded-full blur-[140px] sm:blur-[200px] transform-gpu"></div>
          <div className="absolute -bottom-32 left-10 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-rose-500/10 rounded-full blur-[120px] sm:blur-[170px] transform-gpu"></div>
        </>
      )}

      {/* 3. Opción: Rejilla Tech Grid Minimalista */}
      {pattern === 'lineas_geomets' && (
        <>
          <div
            className="absolute inset-0 opacity-[0.035] transform-gpu"
            style={{
              backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(to right, #ffffff 1px, transparent 1px)`,
              backgroundSize: '80px 80px',
            }}
          ></div>
          <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[130px] transform-gpu"></div>
        </>
      )}

      {/* 4. Opción: Degradado Velvet Luxe */}
      {pattern === 'degradado_luxe' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-emerald-500/10 opacity-70 transform-gpu"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-amber-500/15 rounded-full blur-[180px] transform-gpu"></div>
        </>
      )}

      {/* 5. Opción: Patrón Custom SVG Cargado desde el Registro */}
      {isCustomSvgPattern && patternUrl && (
        <>
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
        </>
      )}
    </div>
  );
});
