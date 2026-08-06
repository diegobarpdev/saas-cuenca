import React, { useState } from 'react';
import { Plus, Check, Flame, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/currency';
import { getProductPriceInfo } from '@/lib/utils/promo';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number, notas: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const priceInfo = getProductPriceInfo(product);

  const handleAdd = () => {
    onAddToCart(product, 1, '');
    setAdded(true);
    toast.success(`¡${product.nombre} agregado!`, {
      description: formatCurrency(priceInfo.precioActual),
      duration: 2000,
    });
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div
      className={`group relative rounded-3xl bg-[#0F1420]/80 hover:bg-[#131929] border transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-2xl ${
        product.disponible
          ? 'border-white/10 hover:border-amber-500/30'
          : 'border-rose-500/20 opacity-65 bg-[#0F1420]/40'
      }`}
    >
      {/* Fotografía de Gran Tamaño (Estilo Airbnb / Apple) */}
      <div className="relative w-full h-56 bg-[#080B11] overflow-hidden">
        {product.imagen_url ? (
          <img
            src={product.imagen_url}
            alt={product.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-[#0A0D16] font-display font-medium text-xs gap-1">
            <span>Fotografía de producto</span>
          </div>
        )}

        {/* Degradado sutil inferior para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1420] via-transparent to-transparent opacity-80"></div>

        {/* Badge de Promoción Flotante a la Izquierda */}
        {product.disponible && priceInfo.tieneOferta && (
          <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-display font-extrabold text-xs shadow-lg flex items-center gap-1 animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-slate-950" />
            <span>{product.etiqueta_promo || `${priceInfo.descuentoPorcentaje}% OFF`}</span>
          </div>
        )}

        {/* Precio Flotante Elegante */}
        <div className="absolute top-3 right-3 z-10 px-3.5 py-1 rounded-full bg-slate-950/90 backdrop-blur-md border border-amber-500/30 shadow-md flex items-center gap-1.5 font-mono">
          {priceInfo.tieneOferta ? (
            <>
              <span className="text-slate-400 text-xs line-through opacity-80">
                {formatCurrency(priceInfo.precioOriginal)}
              </span>
              <span className="text-amber-400 font-bold text-sm">
                {formatCurrency(priceInfo.precioActual)}
              </span>
            </>
          ) : (
            <span className="text-amber-400 font-bold text-sm">
              {formatCurrency(priceInfo.precioOriginal)}
            </span>
          )}
        </div>

        {!product.disponible && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-rose-950/90 backdrop-blur-md text-rose-300 font-medium text-xs border border-rose-500/30">
            Agotado hoy
          </div>
        )}
      </div>

      {/* Contenido & Tipografía */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-1.5">
          <h3 className="font-display font-bold text-white text-base md:text-lg group-hover:text-amber-300 transition-colors leading-snug">
            {product.nombre}
          </h3>
          {product.descripcion && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {product.descripcion}
            </p>
          )}
        </div>

        {/* Botón de Acción Táctil (Apple / Shopify Microinteraction) */}
        <button
          onClick={handleAdd}
          disabled={!product.disponible}
          className={`w-full py-3 px-4 rounded-2xl font-display font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border ${
            !product.disponible
              ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
              : added
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-950/90 hover:bg-amber-500 text-slate-200 hover:text-slate-950 border-slate-800 hover:border-amber-400 shadow-md'
          }`}
        >
          {added ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>¡Agregado al Pedido!</span>
            </>
          ) : !product.disponible ? (
            <span>No Disponible</span>
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
