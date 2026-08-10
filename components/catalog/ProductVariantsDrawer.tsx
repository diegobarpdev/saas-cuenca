'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, ChevronRight, Loader2 } from 'lucide-react';
import { Product, CartItem } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/currency';
import { getProductPriceInfo } from '@/lib/utils/promo';
import { createClient } from '@/lib/supabase/client';

interface OptionValue {
  id: string;
  group_id: string;
  nombre: string;
  precio_adicional: number;
  disponible: boolean;
  orden: number;
}

interface OptionGroup {
  id: string;
  product_id: string;
  nombre: string;
  tipo: 'radio' | 'checkbox';
  requerido: boolean;
  seleccion_minima: number;
  seleccion_maxima: number;
  orden: number;
  values: OptionValue[];
}

interface ProductVariantsDrawerProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, notas: string, opciones: CartItem['opciones_seleccionadas']) => void;
  primaryColor?: string;
}

export function ProductVariantsDrawer({
  product,
  onClose,
  onAddToCart,
  primaryColor = '#F59E0B',
}: ProductVariantsDrawerProps) {
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [notas, setNotas] = useState('');

  const priceInfo = product ? getProductPriceInfo(product) : null;

  useEffect(() => {
    if (!product) return;
    setSelectedOptions({});
    setQuantity(1);
    setNotas('');
    loadOptionGroups(product.id);
  }, [product?.id]);

  async function loadOptionGroups(productId: string) {
    setLoadingOptions(true);
    try {
      const supabase = createClient();
      const { data: groups } = await supabase
        .from('product_option_groups')
        .select('*')
        .eq('product_id', productId)
        .order('orden');

      if (!groups || groups.length === 0) {
        setOptionGroups([]);
        setLoadingOptions(false);
        return;
      }

      const groupIds = groups.map((g: any) => g.id);
      const { data: values } = await supabase
        .from('product_option_values')
        .select('*')
        .in('group_id', groupIds)
        .eq('disponible', true)
        .order('orden');

      const enriched = groups.map((g: any) => ({
        ...g,
        values: (values || []).filter((v: any) => v.group_id === g.id),
      }));

      setOptionGroups(enriched as OptionGroup[]);
    } catch (err) {
      console.error('Error cargando opciones:', err);
    } finally {
      setLoadingOptions(false);
    }
  }

  const toggleOption = (group: OptionGroup, valueId: string) => {
    setSelectedOptions((prev) => {
      const current = prev[group.id] || [];

      if (group.tipo === 'radio') {
        // Single choice — replace selection
        return { ...prev, [group.id]: [valueId] };
      } else {
        // Multi-choice checkbox — toggle
        if (current.includes(valueId)) {
          const next = current.filter((id) => id !== valueId);
          return { ...prev, [group.id]: next };
        } else {
          if (current.length >= group.seleccion_maxima) {
            // Already at max, replace oldest
            const next = [...current.slice(1), valueId];
            return { ...prev, [group.id]: next };
          }
          return { ...prev, [group.id]: [...current, valueId] };
        }
      }
    });
  };

  const isValid = () => {
    return optionGroups.every((group) => {
      if (!group.requerido) return true;
      const selected = selectedOptions[group.id] || [];
      return selected.length >= group.seleccion_minima;
    });
  };

  const computedOptionsCost = optionGroups.reduce((total, group) => {
    const selected = selectedOptions[group.id] || [];
    return total + group.values
      .filter((v) => selected.includes(v.id))
      .reduce((acc, v) => acc + Number(v.precio_adicional), 0);
  }, 0);

  const unitPrice = priceInfo ? priceInfo.precioActual + computedOptionsCost : 0;
  const totalPrice = unitPrice * quantity;

  const buildOpcionesSeleccionadas = (): CartItem['opciones_seleccionadas'] => {
    const result: CartItem['opciones_seleccionadas'] = [];
    for (const group of optionGroups) {
      const selected = selectedOptions[group.id] || [];
      for (const valueId of selected) {
        const value = group.values.find((v) => v.id === valueId);
        if (value) {
          result!.push({
            grupo_nombre: group.nombre,
            opcion_nombre: value.nombre,
            precio_adicional: Number(value.precio_adicional),
          });
        }
      }
    }
    return result;
  };

  const handleConfirm = () => {
    if (!product || !isValid()) return;
    const opciones = buildOpcionesSeleccionadas();
    onAddToCart(product, quantity, notas, opciones);
    onClose();
  };

  if (!product) return null;

  const hasOptions = optionGroups.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer — sube desde el bottom en móvil, centrado como modal en desktop */}
      <div className="fixed inset-x-0 bottom-0 z-[70] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4 pointer-events-none">
        <div
          className="relative w-full sm:max-w-lg bg-[#0D121F] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pill Handle (mobile) */}
          <div className="flex justify-center pt-3 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-start gap-3 p-5 pb-3 shrink-0">
            {product.imagen_url && (
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                <img src={product.imagen_url} alt={product.nombre} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-black text-white text-lg leading-tight truncate">{product.nombre}</h2>
              {product.descripcion && (
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{product.descripcion}</p>
              )}
              <div className="mt-1 font-mono font-bold text-sm" style={{ color: primaryColor }}>
                {priceInfo?.tieneOferta ? (
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-slate-500 text-xs line-through">{formatCurrency(priceInfo.precioOriginal)}</span>
                    {formatCurrency(priceInfo.precioActual)}
                  </span>
                ) : (
                  formatCurrency(priceInfo?.precioOriginal || 0)
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white shrink-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-5">
            {loadingOptions ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                <span className="ml-2 text-sm text-slate-400">Cargando opciones...</span>
              </div>
            ) : !hasOptions ? (
              /* Sin opciones — solo cantidad y notas */
              null
            ) : (
              optionGroups.map((group) => {
                const selected = selectedOptions[group.id] || [];
                return (
                  <div key={group.id} className="space-y-2.5">
                    {/* Group Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">{group.nombre}</h3>
                        <p className="text-[10px] text-slate-500">
                          {group.tipo === 'radio'
                            ? 'Elige una opción'
                            : `Elige hasta ${group.seleccion_maxima}`}
                          {group.requerido && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                              Obligatorio
                            </span>
                          )}
                        </p>
                      </div>
                      {group.requerido && selected.length === 0 && (
                        <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      {group.requerido && selected.length > 0 && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>

                    {/* Options */}
                    <div className="space-y-1.5">
                      {group.values.map((value) => {
                        const isSelected = selected.includes(value.id);
                        return (
                          <button
                            key={value.id}
                            onClick={() => toggleOption(group, value.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                              isSelected
                                ? 'border-amber-500/60 bg-amber-500/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            }`}
                          >
                            {/* Check indicator */}
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? 'border-amber-500 bg-amber-500'
                                  : 'border-slate-600'
                              } ${group.tipo === 'checkbox' ? 'rounded-md' : 'rounded-full'}`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                            </div>

                            <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                              {value.nombre}
                            </span>

                            {value.precio_adicional > 0 && (
                              <span className={`text-xs font-mono font-bold shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`}>
                                +{formatCurrency(value.precio_adicional)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}

            {/* Notas adicionales */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Notas especiales (opcional)
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: sin cebolla, extra picante, sin sal..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 p-5 pt-3 border-t border-white/10 space-y-3">
            {/* Quantity picker */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-300">Cantidad</span>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl border border-white/10 p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-white font-display font-black w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-950 transition-colors font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Add button */}
            <button
              onClick={handleConfirm}
              disabled={!isValid() || !product.disponible}
              className="w-full py-3.5 rounded-2xl font-display font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={
                isValid() && product.disponible
                  ? { backgroundColor: primaryColor, color: '#090D16' }
                  : {}
              }
            >
              {isValid() ? (
                <>
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Agregar al Pedido — {formatCurrency(totalPrice)}</span>
                </>
              ) : (
                <span>Completa las opciones obligatorias</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
