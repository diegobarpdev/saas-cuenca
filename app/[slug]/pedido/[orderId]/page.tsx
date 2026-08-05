'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle2, Package, Truck, PhoneCall, Receipt, Sparkles } from 'lucide-react';
import { MOCK_BUSINESS, MOCK_INITIAL_ORDERS } from '@/lib/supabase/mock-data';
import { formatCurrency } from '@/lib/utils/currency';
import { OrderBadge, PaymentBadge } from '@/components/ui/Badge';
import { OrderStatus } from '@/lib/types/database';

export default function OrderTrackingPage({ params }: { params: Promise<{ slug: string; orderId: string }> }) {
  const resolvedParams = use(params);
  const { slug, orderId } = resolvedParams;

  const business = MOCK_BUSINESS;
  
  // Estado local del pedido
  const [order, setOrder] = useState(() => MOCK_INITIAL_ORDERS[0]);

  // Escuchar eventos en Tiempo Real entre pestañas (BroadcastChannel)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('saas-cuenca-orders-channel');

      channel.onmessage = (event) => {
        if (event.data?.type === 'ORDER_STATUS_CHANGED') {
          setOrder((prev) => ({
            ...prev,
            estado: event.data.newStatus as OrderStatus,
          }));
        }
      };

      return () => {
        channel.close();
      };
    }
  }, []);

  const steps = [
    { key: 'pendiente', label: 'Recibido', icon: Clock },
    { key: 'aceptado', label: 'Aceptado', icon: CheckCircle2 },
    { key: 'en_preparacion', label: 'En preparación', icon: Package },
    { key: 'listo', label: 'Listo / En camino', icon: Truck },
  ];

  const getCurrentStepIndex = () => {
    switch (order.estado) {
      case 'pendiente':
        return 0;
      case 'aceptado':
        return 1;
      case 'en_preparacion':
        return 2;
      case 'listo':
      case 'entregado':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 font-sans pb-16 relative overflow-hidden">
      {/* Glow Ambient Backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 glow-ambient-emerald pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-30 glass-panel border-b border-white/10 px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href={`/${slug}`}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo</span>
          </Link>
          <h1 className="font-display font-extrabold text-sm text-white">Seguimiento en Vivo</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6 relative z-10">
        {/* Banner de Estado del Pedido */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 text-center space-y-5 shadow-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono-tech">
            <Sparkles className="w-3.5 h-3.5" /> Transmisión en Tiempo Real Activa
          </div>

          <div>
            <OrderBadge status={order.estado} className="text-sm px-4 py-1.5 mb-3" />
            <h2 className="text-3xl font-display font-black text-white tracking-tight">
              Pedido #{String(order.numero_pedido).padStart(4, '0')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Esta pantalla cambia automáticamente en tu celular cuando {business.nombre} actualiza tu pedido.
            </p>
          </div>

          {/* Stepper de Progreso */}
          <div className="pt-4 grid grid-cols-4 gap-2 relative">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx <= currentStep;
              return (
                <div key={step.key} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/30 scale-105'
                        : 'bg-slate-950 text-slate-600 border-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[11px] font-display font-extrabold text-center ${
                      isCompleted ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumen de Detalles */}
        <div className="glass-card p-5 md:p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <h3 className="font-display font-black text-sm text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" /> Detalle de la Compra
          </h3>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Cliente:</span>
              <span className="font-semibold text-white">{order.cliente_nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Teléfono:</span>
              <span>{order.cliente_telefono}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Entrega:</span>
              <span className="capitalize font-semibold text-emerald-400">{order.tipo_entrega}</span>
            </div>
            {order.cliente_direccion && (
              <div className="flex justify-between">
                <span className="text-slate-400">Dirección Cuenca:</span>
                <span className="text-right max-w-[200px] truncate">{order.cliente_direccion}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-slate-400">Método de Pago:</span>
              <PaymentBadge status={order.estado_pago} method={order.metodo_pago} />
            </div>
          </div>

          {/* Facturación Ecuador */}
          {order.requiere_factura && order.datos_facturacion && (
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/5 text-xs space-y-1">
              <p className="font-display font-bold text-emerald-400">Factura solicitada a:</p>
              <p><span className="text-slate-400">{order.datos_facturacion.tipo_doc}:</span> {order.datos_facturacion.num_doc}</p>
              <p><span className="text-slate-400">Razón Social:</span> {order.datos_facturacion.razon_social}</p>
              <p><span className="text-slate-400">Email:</span> {order.datos_facturacion.email}</p>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-white/10">
            <span>Total Pagado / A Cobrar:</span>
            <span className="text-lg font-mono-tech text-emerald-400">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Botón WhatsApp del Negocio */}
        <a
          href={`https://wa.me/${business.telefono_whatsapp}?text=Hola,%20quisiera%20consultar%20sobre%20mi%20pedido%20%23${order.numero_pedido}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 active:scale-98 transition-all"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Contactar a {business.nombre} por WhatsApp</span>
        </a>
      </main>
    </div>
  );
}
