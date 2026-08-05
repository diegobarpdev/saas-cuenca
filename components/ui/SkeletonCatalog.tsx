'use client';

import React from 'react';

export function SkeletonCatalog() {
  return (
    <div className="min-h-screen bg-[#090C15] text-slate-100 flex flex-col font-sans w-full animate-pulse">
      {/* Skeleton Header */}
      <header className="sticky top-0 z-40 bg-[#090C15]/90 border-b border-white/10 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-slate-800/80"></div>
            <div className="space-y-2">
              <div className="w-36 h-5 rounded-lg bg-slate-800/80"></div>
              <div className="w-24 h-3.5 rounded-lg bg-slate-800/60"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-10 rounded-2xl bg-slate-800/80"></div>
            <div className="w-28 h-10 rounded-2xl bg-slate-800/80"></div>
          </div>
        </div>
      </header>

      {/* Skeleton Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 flex-1 w-full space-y-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Skeleton Left Sidebar */}
          <aside className="w-full lg:w-72 space-y-6 flex-shrink-0">
            <div className="luxe-card p-6 rounded-3xl space-y-4">
              <div className="w-20 h-4 rounded-full bg-slate-800"></div>
              <div className="w-48 h-6 rounded-xl bg-slate-800"></div>
              <div className="w-full h-12 rounded-2xl bg-slate-800/60"></div>
            </div>
            <div className="w-full h-11 rounded-2xl bg-slate-800/60"></div>
            <div className="hidden lg:block luxe-card p-4 rounded-3xl space-y-3">
              <div className="w-24 h-4 rounded bg-slate-800"></div>
              <div className="w-full h-9 rounded-2xl bg-slate-800/50"></div>
              <div className="w-full h-9 rounded-2xl bg-slate-800/50"></div>
              <div className="w-full h-9 rounded-2xl bg-slate-800/50"></div>
            </div>
          </aside>

          {/* Skeleton Right Main Showcase */}
          <div className="flex-1 w-full space-y-6">
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/5 space-y-3">
              <div className="w-32 h-4 rounded-full bg-slate-800"></div>
              <div className="w-64 h-8 rounded-xl bg-slate-800"></div>
              <div className="w-96 h-4 rounded bg-slate-800/60"></div>
            </div>

            {/* Skeleton Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-3xl bg-slate-900/60 border border-white/5 overflow-hidden space-y-4 p-4">
                  <div className="w-full h-48 rounded-2xl bg-slate-800/70"></div>
                  <div className="space-y-2">
                    <div className="w-3/4 h-5 rounded-lg bg-slate-800"></div>
                    <div className="w-full h-3.5 rounded bg-slate-800/60"></div>
                  </div>
                  <div className="w-full h-11 rounded-2xl bg-slate-800/80"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
