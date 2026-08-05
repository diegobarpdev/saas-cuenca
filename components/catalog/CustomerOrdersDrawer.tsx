'use client';

import React from 'react';
import Link from 'next/link';
import { X, ShoppingBag, Clock, ExternalLink, RefreshCw, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { Order } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/currency';

interface CustomerOrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  loading: boolean;
  businessSlug: string;
}

export function CustomerOrdersDrawer({
  isOpen,
  onClose,
  orders,
  loading,
  businessSlug,
}: CustomerOrdersDrawerProps) {
  if (!isOpen) return null;

  const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    pendiente: { label: 'Esperando Confirmación', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    aceptado: { label: 'Aceptado por el Local', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    en_preparacion: { label: 'En Cocina / Preparación', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    listo: { label: '¡Listo para Entrega!', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    entregado: { label: 'Entregado / Completado', bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' },
    cancelado: { label: 'Cancelado', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md luxe-card border-l border-white/10 flex flex-col justify-between shadow-2xl relative z-10 text-slate-100">
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-black text-lg text-white leading-tight">Mis Pedidos en Piku</h2>
                <p className="text-[11px] text-slate-400 font-medium">Historial y estado en tiempo real</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Orders List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                <p>Cargando tus pedidos en tiempo real...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3 glass-card rounded-3xl border border-slate-800">
                <ShoppingBag className="w-10 h-10 mx-auto text-slate-600" />
                <p className="font-display font-bold text-sm text-slate-300">Aún no has realizado pedidos en este dispositivo.</p>
                <p className="text-xs text-slate-500">Tus compras futuras aparecerán aquí en vivo con su avance.</p>
              </div>
            ) : (
              orders.map((order) => {
                const conf = statusConfig[order.estado] || statusConfig.pendiente;
                const formattedDate = new Date(order.created_at).toLocaleDateString('es-EC', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-amber-500/30 transition-all space-y-3 shadow-lg"
                  >
                    {/* Header Pedido */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <div>
                        <span className="font-mono-tech font-black text-sm text-amber-400">
                          #{String(order.numero_pedido).padStart(4, '0')}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono-tech mt-0.5">
                          {formattedDate}
                        </span>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-[10px] font-mono-tech font-bold border ${conf.bg} ${conf.text} ${conf.border}`}>
                        {conf.label}
                      </span>
                    </div>

                    {/* Resumen */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Total de la compra:</span>
                      <span className="font-mono-tech font-black text-white text-sm">
                        {formatCurrency(order.total)}
                      </span>
                    </div>

                    {/* Botón de Seguimiento Live */}
                    <Link
                      href={`/${businessSlug}/pedido/${order.id}`}
                      onClick={onClose}
                      className="w-full py-2.5 px-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-display font-extrabold flex items-center justify-between border border-amber-500/30 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ver Avance en Tiempo Real</span>
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-slate-950/90 text-center">
            <p className="text-[11px] text-slate-500 font-medium">
              🔒 Tus datos e historial se resguardan de forma privada en tu dispositivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
