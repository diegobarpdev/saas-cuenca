import React from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Flame, Sparkles } from 'lucide-react';
import { CartItem } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/currency';
import { getProductPriceInfo } from '@/lib/utils/promo';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, notas?: string) => void;
  onRemoveItem: (productId: string, notas?: string) => void;
  onClearCart: () => void;
  subtotal: number;
  businessSlug: string;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  subtotal,
  businessSlug,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const ahorroTotal = items.reduce((sum, item) => {
    const { ahorroMonto } = getProductPriceInfo(item.product);
    return sum + ahorroMonto * item.cantidad;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end sm:justify-stretch">
      {/* Backdrop con Blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#05070D]/90 transition-opacity"
      />

      {/* Drawer Container: Bottom-Sheet en móvil, Side-Drawer en Desktop */}
      <div className="relative w-full max-w-md ml-auto bg-[#0D1322] text-white shadow-2xl flex flex-col border-t sm:border-t-0 sm:border-l border-white/10 rounded-t-3xl sm:rounded-t-none sm:rounded-l-3xl max-h-[90vh] sm:max-h-full sm:h-full z-10 overflow-hidden">
        
        {/* Handle visual para móvil */}
        <div className="w-12 h-1.5 bg-slate-700/60 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Header del Carrito */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h2 className="font-display font-extrabold text-base text-white">Tu Carrito de Pedido</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Ítems con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-600">
                <ShoppingBag className="w-8 h-8 stroke-1" />
              </div>
              <p className="font-display font-bold text-sm text-slate-300">Tu carrito está vacío</p>
              <p className="text-xs text-slate-500 max-w-xs">Agrega productos del catálogo para comenzar tu pedido directo.</p>
            </div>
          ) : (
            items.map((item, idx) => {
              const priceInfo = getProductPriceInfo(item.product);
              return (
                <div
                  key={`${item.product.id}-${idx}`}
                  className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between gap-3 shadow-md"
                >
                  {/* Nombre y Precio */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-sm text-white truncate leading-snug">{item.product.nombre}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5 font-mono-tech">
                      {priceInfo.tieneOferta ? (
                        <>
                          <span className="text-[11px] text-slate-500 line-through">
                            {formatCurrency(priceInfo.precioOriginal)}
                          </span>
                          <span className="text-xs text-amber-400 font-bold">
                            {formatCurrency(priceInfo.precioActual)} c/u
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-sans font-bold border border-rose-500/30">
                            {priceInfo.descuentoPorcentaje}% OFF
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-emerald-400 font-semibold">
                          {formatCurrency(priceInfo.precioOriginal)} c/u
                        </span>
                      )}
                    </div>
                    {item.notas && <p className="text-[11px] text-slate-400 italic mt-0.5 truncate">Nota: {item.notas}</p>}
                  </div>

                  {/* Controles de Cantidad (+ / -) */}
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex-shrink-0">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.cantidad - 1, item.notas)}
                      className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-mono-tech font-bold text-xs text-white">{item.cantidad}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.cantidad + 1, item.notas)}
                      className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Botón Eliminar */}
                  <button
                    onClick={() => onRemoveItem(item.product.id, item.notas)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex-shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer del Carrito (Subtotal & Checkout CTA) */}
        {items.length > 0 && (
          <div className="p-4 border-t border-white/10 bg-slate-950/90 flex-shrink-0 space-y-3">
            {ahorroTotal > 0 && (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-amber-500/15 to-rose-500/15 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 font-display font-semibold">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ¡Estás ahorrando con tus promociones!
                </span>
                <span className="font-mono-tech font-bold text-amber-400">-{formatCurrency(ahorroTotal)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 font-medium">Subtotal a pagar</span>
              <span className="font-mono-tech font-black text-xl text-emerald-400">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={onClearCart}
                className="px-3.5 py-3 rounded-2xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-display font-semibold transition-colors"
              >
                Vaciar
              </button>
              <Link
                href={`/${businessSlug}/checkout`}
                onClick={onClose}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-display font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-98 transition-all border border-emerald-400/30"
              >
                <span>Proceder al Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
