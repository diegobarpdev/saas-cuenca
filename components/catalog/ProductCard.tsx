import React, { useState } from 'react';
import { Flame } from 'lucide-react';
import { Product, CartItem } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/currency';
import { getProductPriceInfo } from '@/lib/utils/promo';
import { ProductVariantsDrawer } from '@/components/catalog/ProductVariantsDrawer';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number, notas: string, opciones?: CartItem['opciones_seleccionadas']) => void;
  primaryColor?: string;
  secondaryColor?: string;
}

export function ProductCard({ product, onAddToCart, primaryColor = '#F59E0B', secondaryColor = '#D97706' }: ProductCardProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  const priceInfo = getProductPriceInfo(product);

  const handleCardClick = () => {
    if (!product.disponible) return;
    setShowDrawer(true);
  };

  const handleDrawerAdd = (prod: Product, qty: number, notas: string, opciones?: CartItem['opciones_seleccionadas']) => {
    onAddToCart(prod, qty, notas, opciones);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`group relative rounded-2xl bg-[#0D121F] border transition-all duration-300 overflow-hidden flex flex-row sm:flex-col justify-between shadow-lg hover:shadow-xl hover:shadow-amber-500/10 p-3 sm:p-0 cursor-pointer h-full ${
          product.disponible
            ? 'border-white/10 hover:border-amber-500/40'
            : 'border-rose-500/20 opacity-60 bg-[#0D121F]/50'
        }`}
      >
        {/* 1. FOTOGRAFÍA DEL PRODUCTO (Izquierda en Móvil, Arriba en Desktop) */}
        <div className="relative w-20 h-20 sm:w-full sm:h-32 bg-[#07090E] rounded-xl sm:rounded-none overflow-hidden shrink-0 order-1 self-center sm:self-auto">
          {product.imagen_url ? (
            <img
              src={product.imagen_url}
              alt={product.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#121929] via-[#0E1424] to-[#182035] flex flex-col items-center justify-center text-slate-400 p-2 text-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-display font-black text-xs sm:text-lg shadow-lg">
                {product.nombre.charAt(0)}
              </div>
            </div>
          )}

          {/* Transición Suave de Brillo en Desktop */}
          <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-[#0D121F] via-[#0D121F]/30 to-transparent opacity-90"></div>

          {/* Chip Promo */}
          {product.disponible && priceInfo.tieneOferta && (
            <div className="absolute top-1 left-1 sm:top-3 sm:left-3 z-10 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 font-display font-black text-[8px] sm:text-[10px] shadow-xl flex items-center gap-0.5 border border-amber-300/40 tracking-tight">
              <Flame className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 fill-slate-950 text-slate-950" />
              <span>{product.etiqueta_promo || `${priceInfo.descuentoPorcentaje}% OFF`}</span>
            </div>
          )}

          {!product.disponible && (
            <div className="absolute top-1 left-1 sm:top-3 sm:left-3 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded bg-rose-950/90 backdrop-blur-md text-rose-300 font-medium text-[8px] sm:text-[10px] border border-rose-500/30">
              Agotado
            </div>
          )}
        </div>

        {/* 2. DETALLE E INFORMACIÓN DEL PRODUCTO (A la Derecha en Móvil, Abajo en Desktop) */}
        <div className="flex-1 min-w-0 pl-3 sm:p-3 flex flex-col justify-between gap-2 sm:gap-2.5 order-2">
          {/* Textos del Producto (Título y Descripción) */}
          <div className="space-y-1 sm:space-y-1.5">
            <h3 className="font-display font-extrabold text-white text-base sm:text-sm group-hover:text-amber-400 transition-colors leading-tight tracking-tight line-clamp-1 sm:line-clamp-2">
              {product.nombre}
            </h3>

            {product.descripcion && (
              <p className="text-xs text-slate-400 line-clamp-1 sm:line-clamp-2 leading-relaxed font-normal">
                {product.descripcion}
              </p>
            )}
          </div>

          {/* Fila de Precio y Botón Agregar */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-white/5">
            {/* Precio */}
            <div className="font-mono flex flex-col">
              {priceInfo.tieneOferta ? (
                <>
                  <span className="text-slate-500 text-[10px] sm:text-xs line-through leading-none mb-1">
                    {formatCurrency(priceInfo.precioOriginal)}
                  </span>
                  <span className="font-bold text-sm leading-none" style={{ color: primaryColor }}>
                    {formatCurrency(priceInfo.precioActual)}
                  </span>
                </>
              ) : (
                <span className="font-bold text-sm leading-none" style={{ color: primaryColor }}>
                  {formatCurrency(priceInfo.precioOriginal)}
                </span>
              )}
            </div>

            {/* Indicador de toque */}
            {product.disponible ? (
              <span
                className="px-2.5 py-1.5 rounded-xl font-display font-extrabold text-xs border border-white/10 text-slate-400 group-hover:border-amber-500/40 group-hover:text-amber-400 transition-all"
              >
                Ver opciones
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl font-display font-extrabold text-xs bg-slate-900/60 text-slate-600 border border-slate-800">
                Agotado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Drawer de Variantes */}
      {showDrawer && (
        <ProductVariantsDrawer
          product={product}
          onClose={() => setShowDrawer(false)}
          onAddToCart={handleDrawerAdd}
          primaryColor={primaryColor}
        />
      )}
    </>
  );
}
