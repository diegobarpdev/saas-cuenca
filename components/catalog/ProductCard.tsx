'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Check, Flame, Sparkles } from 'lucide-react';
import { Product } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/currency';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number, notas: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(product, 1, '');
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="group relative rounded-3xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 hover:border-amber-500/40 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 backdrop-blur-sm">
      {/* Media & Overlay Section */}
      <div className="relative w-full h-56 bg-slate-950 overflow-hidden">
        {product.imagen_url ? (
          <Image
            src={product.imagen_url}
            alt={product.nombre}
            fill
            className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900 font-display font-medium text-xs">
            Sin Imagen
          </div>
        )}
        
        {/* Dark Editorial Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/40 to-transparent"></div>

        {/* Asymmetric Recommendation Tag */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md text-[10px] font-mono-tech font-bold text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-lg">
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Especialidad</span>
        </div>

        {/* High Contrast Floating Price Badge */}
        <div className="absolute top-3 right-3 px-3.5 py-1 rounded-full bg-[#050811]/90 backdrop-blur-md text-amber-300 font-mono-tech font-black text-sm border border-amber-500/50 shadow-2xl shadow-amber-500/20">
          {formatCurrency(product.precio)}
        </div>
      </div>

      {/* Product Content */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4 relative z-10">
        <div className="space-y-1.5">
          <h3 className="font-display font-extrabold text-white text-base md:text-lg group-hover:text-amber-300 transition-colors leading-tight">
            {product.nombre}
          </h3>
          {product.descripcion && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-normal">
              {product.descripcion}
            </p>
          )}
        </div>

        {/* Tactile Action Button */}
        <button
          onClick={handleAdd}
          disabled={!product.disponible}
          className={`w-full py-3.5 px-4 rounded-2xl font-display font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border shadow-lg ${
            added
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-emerald-500/40 scale-102'
              : 'bg-slate-950/80 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 text-slate-200 hover:text-slate-950 border-slate-800 hover:border-amber-400/50 shadow-black/40'
          }`}
        >
          {added ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>¡Agregado a tu Pedido!</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-amber-400 group-hover:text-slate-950 transition-colors" />
              <span>Agregar al Pedido</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
