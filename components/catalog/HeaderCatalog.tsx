'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag, Phone, MapPin, Clock, Star, ClipboardList } from 'lucide-react';
import { Business } from '@/lib/types/database';
import { useCustomerOrders } from '@/hooks/useCustomerOrders';
import { CustomerOrdersDrawer } from '@/components/catalog/CustomerOrdersDrawer';

interface HeaderCatalogProps {
  business: Business;
  cartCount: number;
  onOpenCart: () => void;
}

export function HeaderCatalog({ business, cartCount, onOpenCart }: HeaderCatalogProps) {
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const { orders, loading, activeOrdersCount } = useCustomerOrders(business.slug);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#090C15]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3.5">
            {business.logo_url ? (
              <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-2xl overflow-hidden ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10 flex-shrink-0">
                <Image
                  src={business.logo_url}
                  alt={business.nombre}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-display font-black text-slate-950 text-xl shadow-lg shadow-amber-500/20 flex-shrink-0">
                {business.nombre.charAt(0)}
              </div>
            )}

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-base md:text-xl text-white tracking-tight leading-none">
                  {business.nombre}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono-tech font-bold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Abierto
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                {business.direccion && (
                  <span className="flex items-center gap-1 truncate max-w-[180px] sm:max-w-xs text-slate-300">
                    <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span className="truncate">{business.direccion}</span>
                  </span>
                )}
                <span className="hidden sm:flex items-center gap-1 text-amber-400 font-mono-tech">
                  <Star className="w-3 h-3 fill-amber-400" /> 4.9 (120+)
                </span>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* Botón Mis Pedidos */}
            <button
              onClick={() => setIsOrdersOpen(true)}
              className="relative p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-slate-900/90 text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition-all border border-slate-800 flex items-center gap-2 text-xs font-display font-bold active:scale-95 shadow-md"
              title="Ver mis pedidos anteriores"
            >
              <ClipboardList className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Mis Pedidos</span>
              {activeOrdersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-mono-tech font-black text-[10px] flex items-center justify-center animate-pulse">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            {/* Carrito */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-display font-black text-xs md:text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all border border-amber-400/40"
            >
              <ShoppingBag className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span className="hidden sm:inline">Mi Pedido</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 font-mono-tech font-black text-[11px] flex items-center justify-center shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Drawer Historial de Pedidos */}
      <CustomerOrdersDrawer
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        orders={orders}
        loading={loading}
        businessSlug={business.slug}
      />
    </>
  );
}
