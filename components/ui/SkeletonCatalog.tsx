'use client';

import React from 'react';

export function SkeletonCatalog() {
  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans w-full animate-pulse relative overflow-hidden">
      {/* Luces Ambientales de Fondo */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px]"></div>
      <div className="pointer-events-none absolute top-1/3 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px]"></div>

      {/* Contenido Principal Skeleton */}
      <main className="max-w-7xl mx-auto px-3 sm:px-8 py-4 sm:py-8 flex-1 w-full space-y-6 sm:space-y-8 relative z-10">
        {/* Skeleton del Encabezado Único de Marca */}
        <div className="p-4 sm:p-6 rounded-3xl bg-[#0D121F]/80 border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            {/* Logo Skeleton */}
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/80 shrink-0"></div>

            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-40 sm:w-56 h-6 sm:h-7 rounded-xl bg-slate-800"></div>
                <div className="w-16 h-5 rounded-full bg-slate-800/60"></div>
              </div>
              <div className="w-48 sm:w-80 h-3.5 rounded-lg bg-slate-800/50"></div>
              <div className="flex items-center gap-2 pt-1">
                <div className="w-20 h-5 rounded-full bg-slate-800/70"></div>
                <div className="w-24 h-5 rounded-full bg-slate-800/70"></div>
                <div className="w-28 h-5 rounded-full bg-slate-800/70"></div>
              </div>
            </div>
          </div>

          {/* Botones de Navegación Skeleton */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <div className="h-10 rounded-2xl bg-slate-800/80 w-full sm:w-28"></div>
            <div className="h-10 rounded-2xl bg-slate-800/80 w-full sm:w-28"></div>
            <div className="h-10 rounded-2xl bg-slate-800/80 w-full sm:w-24"></div>
            <div className="h-10 rounded-2xl bg-slate-800/80 w-full sm:w-28"></div>
          </div>
        </div>

        {/* Skeleton de Categorías y Buscador */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <div className="w-32 h-10 rounded-2xl bg-slate-800/80 shrink-0"></div>
            <div className="w-36 h-10 rounded-2xl bg-slate-800/60 shrink-0"></div>
            <div className="w-28 h-10 rounded-2xl bg-slate-800/60 shrink-0"></div>
            <div className="w-28 h-10 rounded-2xl bg-slate-800/60 shrink-0"></div>
          </div>

          <div className="w-full md:w-72 h-10 rounded-2xl bg-slate-800/70"></div>
        </div>

        {/* Skeleton de Cuadrícula de Productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-3xl bg-[#0D121F]/80 border border-white/10 overflow-hidden space-y-4 p-4 shadow-xl"
            >
              <div className="w-full h-48 sm:h-56 rounded-2xl bg-slate-800/70"></div>
              <div className="space-y-2">
                <div className="w-3/4 h-5 rounded-lg bg-slate-800"></div>
                <div className="w-full h-3.5 rounded bg-slate-800/60"></div>
                <div className="w-2/3 h-3.5 rounded bg-slate-800/40"></div>
              </div>
              <div className="w-full h-11 rounded-2xl bg-slate-800/80"></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
