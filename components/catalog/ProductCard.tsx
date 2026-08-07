import React, { useState } from 'react';
import { Plus, Check, Flame, X } from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { Product } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/currency';
import { getProductPriceInfo } from '@/lib/utils/promo';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number, notas: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const priceInfo = getProductPriceInfo(product);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, 1, '');
    setAdded(true);
    toast.success(`¡${product.nombre} agregado!`, {
      description: formatCurrency(priceInfo.precioActual),
      duration: 2000,
    });
    setTimeout(() => setAdded(false), 1200);
  };

  const handleModalAdd = (e: React.MouseEvent) => {
    handleAdd(e);
    setShowPreview(false);
  };

  return (
    <>
      {/* Tarjeta de Producto - Diseño Unificado Premium */}
      <div
        onClick={() => setShowPreview(true)}
        className={`group relative rounded-2xl sm:rounded-3xl bg-[#0D121F] border transition-all duration-300 overflow-hidden flex flex-row sm:flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 p-3 sm:p-0 cursor-pointer h-full ${
          product.disponible
            ? 'border-white/10 hover:border-amber-500/40'
            : 'border-rose-500/20 opacity-60 bg-[#0D121F]/50'
        }`}
      >
        {/* 1. FOTOGRAFÍA DEL PRODUCTO (Izquierda en Móvil, Arriba en Desktop) */}
        <div className="relative w-20 h-20 sm:w-full sm:h-44 bg-[#07090E] rounded-xl sm:rounded-none overflow-hidden shrink-0 order-1 self-center sm:self-auto">
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
        <div className="flex-1 min-w-0 pl-3 sm:p-5 flex flex-col justify-between gap-2 sm:gap-4 order-2">
          {/* Textos del Producto (Título y Descripción) */}
          <div className="space-y-1 sm:space-y-1.5">
            <h3 className="font-display font-extrabold text-white text-base sm:text-lg md:text-xl group-hover:text-amber-400 transition-colors leading-tight tracking-tight line-clamp-1 sm:line-clamp-2">
              {product.nombre}
            </h3>

            {product.descripcion && (
              <p className="text-xs sm:text-sm text-slate-400 line-clamp-1 sm:line-clamp-2 leading-relaxed font-normal">
                {product.descripcion}
              </p>
            )}
          </div>

          {/* Fila de Precio y Botón Agregar (Unificada y Alineada) */}
          <div className="flex items-center justify-between gap-3 mt-auto pt-2 sm:pt-3 border-t border-white/5">
            {/* Precio */}
            <div className="font-mono flex flex-col">
              {priceInfo.tieneOferta ? (
                <>
                  <span className="text-slate-500 text-[10px] sm:text-xs line-through leading-none mb-1">
                    {formatCurrency(priceInfo.precioOriginal)}
                  </span>
                  <span className="text-amber-400 font-bold text-sm sm:text-base leading-none">
                    {formatCurrency(priceInfo.precioActual)}
                  </span>
                </>
              ) : (
                <span className="text-amber-400 font-bold text-sm sm:text-base leading-none">
                  {formatCurrency(priceInfo.precioOriginal)}
                </span>
              )}
            </div>

            {/* Botón de Acción Táctil (Móvil y PC) */}
            <button
              onClick={handleAdd}
              disabled={!product.disponible}
              className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl font-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 border shrink-0 ${
                !product.disponible
                  ? 'bg-slate-900/60 text-slate-600 border-slate-800 cursor-not-allowed'
                  : added
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-lg shadow-emerald-500/20'
                  : 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 shadow-md shadow-amber-500/10'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 stroke-[3]" />
                  <span>¡Listo!</span>
                </>
              ) : !product.disponible ? (
                <span>Agotado</span>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 stroke-[2.5]" />
                  <span>Agregar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. MODAL DE PREVISUALIZACIÓN DETALLADA (Preview del Producto) */}
      {showPreview && (
        <div
          onClick={() => setShowPreview(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0D121F] border border-white/10 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Botón Cerrar con z-30 para evitar que la imagen lo tape */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPreview(false);
              }}
              className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Imagen del Modal con Blur Inteligente de Fondo */}
            <div className="relative w-full h-64 bg-[#07090E] overflow-hidden">
              {product.imagen_url ? (
                <>
                  {/* Imagen difusa de fondo para rellenar bordes */}
                  <img
                    src={product.imagen_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-30 select-none pointer-events-none"
                  />
                  {/* Imagen nítida contenida al frente */}
                  <img
                    src={product.imagen_url}
                    alt={product.nombre}
                    className="relative z-10 w-full h-full object-contain"
                  />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#121929] via-[#0E1424] to-[#182035] flex items-center justify-center text-slate-400">
                  <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-display font-black text-4xl shadow-lg">
                    {product.nombre.charAt(0)}
                  </div>
                </div>
              )}

              {/* Degradado sobre imagen */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D121F] via-[#0D121F]/20 to-transparent"></div>

              {/* Promo badge en imagen del modal */}
              {product.disponible && priceInfo.tieneOferta && (
                <div className="absolute bottom-4 left-4 z-10 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 font-display font-black text-xs shadow-xl flex items-center gap-1 border border-amber-300/40 tracking-tight">
                  <Flame className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>{product.etiqueta_promo || `${priceInfo.descuentoPorcentaje}% OFF`}</span>
                </div>
              )}
            </div>

            {/* Detalles en Modal */}
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-display font-black text-white leading-tight">
                  {product.nombre}
                </h2>
                {product.descripcion ? (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    {product.descripcion}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-500 italic font-normal">
                    Sin descripción disponible.
                  </p>
                )}
              </div>

              {/* Precio y Agregar en el Modal */}
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/10">
                <div className="font-mono flex flex-col">
                  <span className="text-xs text-slate-500">Precio unitario</span>
                  {priceInfo.tieneOferta ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-500 text-xs line-through">
                        {formatCurrency(priceInfo.precioOriginal)}
                      </span>
                      <span className="text-amber-400 font-bold text-lg sm:text-xl">
                        {formatCurrency(priceInfo.precioActual)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-amber-400 font-bold text-lg sm:text-xl">
                      {formatCurrency(priceInfo.precioOriginal)}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleModalAdd}
                  disabled={!product.disponible}
                  className={`px-5 py-2.5 rounded-2xl font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95 border ${
                    !product.disponible
                      ? 'bg-slate-900/60 text-slate-600 border-slate-800 cursor-not-allowed'
                      : 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 shadow-md shadow-amber-500/10'
                  }`}
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>Agregar al Pedido</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
