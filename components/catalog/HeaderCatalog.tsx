'use client';

import React, { useState } from 'react';
import { ShoppingBag, ClipboardList, MapPin } from 'lucide-react';
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
      <header className="sticky top-0 z-40 bg-[#080B11]/85 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Marca (Estilo Apple Store) */}
          <div className="flex items-center gap-3.5">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.nombre}
                className="w-10 h-10 rounded-2xl object-cover border border-white/15 flex-shrink-0 shadow-md"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-display font-black text-slate-950 text-lg shadow-md flex-shrink-0">
                {business.nombre.charAt(0)}
              </div>
            )}

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-base md:text-lg text-white tracking-tight leading-none">
                  {business.nombre}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-mono font-bold border border-brand-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
                  Abierto
                </span>
              </div>

              {business.direccion && (
                <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="truncate">{business.direccion}</span>
                </p>
              )}
            </div>
          </div>

          {/* Acciones de Navegación */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsOrdersOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-white/10 flex items-center gap-2 text-xs font-display font-bold active:scale-95 shadow-sm"
            >
              <ClipboardList className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Mis Pedidos</span>
              {activeOrdersCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-400 text-slate-950 rounded-full">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenCart}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-display font-black text-xs md:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all border border-amber-400/30 flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span className="hidden sm:inline">Mi Pedido</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 font-mono font-black text-[11px] flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

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
