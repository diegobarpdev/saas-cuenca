'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle2, Package, Truck, PhoneCall, Receipt, Sparkles, ChefHat, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { MOCK_BUSINESS } from '@/lib/supabase/mock-data';
import { formatCurrency, formatDeliveryType } from '@/lib/utils/currency';
import { OrderBadge, PaymentBadge } from '@/components/ui/Badge';
import { Business, Order, OrderStatus } from '@/lib/types/database';

export default function OrderTrackingPage({ params }: { params: Promise<{ slug: string; orderId: string }> }) {
  const resolvedParams = use(params);
  const { slug, orderId } = resolvedParams;

  const [business, setBusiness] = useState<Business>(MOCK_BUSINESS);
  const [order, setOrder] = useState<Order | null>(null);

  // Cargar datos del Negocio Real por slug
  useEffect(() => {
    async function fetchBusinessData() {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from('businesses')
            .select('*')
            .eq('slug', slug)
            .single();

          if (data) {
            setBusiness(data as Business);
          }
        } catch (e) {
          console.error('Error cargando negocio en seguimiento:', e);
        }
      }
    }
    fetchBusinessData();
  }, [slug]);

  // Cargar datos del pedido real desde Supabase
  useEffect(() => {
    async function fetchOrder() {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

          if (!error && data) {
            setOrder(data as Order);
          }
        } catch (e) {
          console.error('Error cargando pedido desde Supabase:', e);
        }
      }
    }
    fetchOrder();
  }, [orderId]);

  // Escuchar eventos en Tiempo Real WebSockets (Supabase + BroadcastChannel)
  useEffect(() => {
    if (!order?.business_id) return;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      const supabase = createClient();
      const channelName = `kaltiro-orders-${order.business_id}`;
      const existingChannel = supabase.getChannels().find((ch: any) => ch.topic === `realtime:${channelName}`);
      if (existingChannel) {
        supabase.removeChannel(existingChannel);
      }

      const rtChannel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
          },
          (payload: any) => {
            const updated = payload.new as Order;
            if (updated && updated.id === orderId) {
              setOrder((prev) => (prev ? { ...prev, ...updated } : prev));
            }
          }
        )
        .on(
          'broadcast',
          { event: 'ORDER_STATUS_CHANGED' },
          (payload: any) => {
            const data = payload.payload;
            if (data && data.orderId === orderId) {
              const timestampKey = `${data.newStatus}_at`;
              setOrder((prev) => (prev ? { ...prev, estado: data.newStatus as OrderStatus, [timestampKey]: data.timestamp } : prev));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(rtChannel);
      };
    }

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('saas-cuenca-orders-channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'ORDER_STATUS_CHANGED' && event.data?.orderId === orderId) {
          const timestampKey = `${event.data.newStatus}_at`;
          setOrder((prev) => (prev ? { ...prev, estado: event.data.newStatus as OrderStatus, [timestampKey]: event.data.timestamp } : prev));
        }
      };
      return () => {
        channel.close();
      };
    }
  }, [order?.business_id, orderId]);

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-[#070A11] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Clock className="w-8 h-8 text-amber-400 animate-spin" />
        <h2 className="text-sm font-display font-bold text-slate-300">Cargando detalles de tu pedido en tiempo real...</h2>
      </div>
    );
  }

  const steps = [
    { key: 'pendiente', label: 'Recibido', icon: Clock, timestamp: order.created_at },
    { key: 'aceptado', label: 'Aceptado', icon: CheckCircle2, timestamp: order.aceptado_at },
    { key: 'en_preparacion', label: 'En preparación', icon: Package, timestamp: order.en_preparacion_at },
    { key: 'listo', label: 'Listo / En camino', icon: Truck, timestamp: order.listo_at || order.entregado_at },
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

  const getStatusLabel = () => {
    const estado = order.estado;
    const tipo = order.tipo_entrega;
    const servicioMesa = business?.configuracion_operativa?.tipo_servicio_mesa || 'mesero';

    switch (estado) {
      case 'pendiente':
        return 'Procesando Pedido';
      case 'aceptado':
        return 'Confirmado';
      case 'en_preparacion':
        return 'En Cocina';
      case 'listo':
        if (tipo === 'mesa') {
          if (servicioMesa === 'barra') return 'Listo en Barra / Caja';
          return '¡Listo para Servir!';
        }
        if (tipo === 'retiro_local') return '¡Listo para Retirar!';
        return '¡En Camino!';
      case 'entregado':
        if (tipo === 'mesa') {
          if (servicioMesa === 'barra') return 'Entregado en Caja';
          return 'Servido';
        }
        if (tipo === 'retiro_local') return 'Retirado';
        return 'Entregado';
      case 'cancelado':
        return 'Pedido Cancelado';
      default:
        return 'Procesando';
    }
  };

  const getStatusDescription = () => {
    const estado = order.estado;
    const tipo = order.tipo_entrega;
    const mesa = order.numero_mesa ? ` Mesa ${order.numero_mesa}` : '';
    const servicioMesa = business?.configuracion_operativa?.tipo_servicio_mesa || 'mesero';

    switch (estado) {
      case 'pendiente':
        return 'Esperando confirmación del restaurante...';
      case 'aceptado':
        if (tipo === 'mesa') {
          if (servicioMesa === 'barra') return `¡Tu pedido para la${mesa} fue recibido! Preparando ingredientes...`;
          return `¡Tu pedido para la${mesa} fue recibido! Preparando ingredientes...`;
        }
        if (tipo === 'retiro_local') return '¡Tu pedido para llevar fue recibido! Preparando ingredientes...';
        return '¡Tu pedido para domicilio fue recibido! Preparando ingredientes...';
      case 'en_preparacion':
        if (tipo === 'mesa') {
          if (servicioMesa === 'barra') return `El chef está cocinando tus platos para llevar a tu${mesa}.`;
          return `El chef está cocinando tus platos para la${mesa}.`;
        }
        return 'El chef está cocinando tus platos ahora mismo.';
      case 'listo':
        if (tipo === 'mesa') {
          if (servicioMesa === 'barra') return `¡Tu comida está lista! Por favor acércate a la barra/caja para retirarla y llevarla a tu${mesa}.`;
          return `¡Tu comida está lista! Un mesero la llevará a tu${mesa} de inmediato.`;
        }
        if (tipo === 'retiro_local') return '¡Tu pedido está listo para llevar! Ya puedes acercarte a retirarlo.';
        return '¡Tu pedido está listo! El motorizado va en camino a tu dirección.';
      case 'entregado':
        if (tipo === 'mesa') {
          if (servicioMesa === 'barra') return `¡Comida retirada en caja y disfrutada en tu${mesa}! ¡Buen provecho!`;
          return `¡Pedido servido en tu${mesa}! Que disfrutes tu comida.`;
        }
        if (tipo === 'retiro_local') return '¡Pedido entregado y retirado del local! ¡Buen provecho!';
        return '¡Pedido entregado en tu domicilio! ¡Buen provecho!';
      case 'cancelado':
        return 'El restaurante canceló el pedido. Ponte en contacto por WhatsApp.';
      default:
        return 'Tu pedido está siendo procesado.';
    }
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 font-sans pb-16 relative overflow-hidden">
      {/* Glow Ambient Backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 glow-ambient-brand pointer-events-none"></div>

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
          <div>
            <OrderBadge status={order.estado} className="text-sm px-4 py-1.5 mb-3" />
            <h2 className="text-3xl font-display font-black text-white tracking-tight">
              Pedido #{String(order.numero_pedido).padStart(4, '0')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Esta pantalla cambia automáticamente en tu celular cuando {business.nombre} actualiza tu pedido.
            </p>
          </div>

          {/* Visualizador de Actividad en Vivo */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
            {order.estado !== 'entregado' && order.estado !== 'cancelado' && (
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-brand-500/5 animate-pulse"></div>
            )}
            
            <div className="relative z-10 flex items-center justify-center">
              {order.estado === 'pendiente' && (
                <div className="relative flex h-10 w-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400/20 opacity-75"></span>
                  <div className="relative rounded-full h-10 w-10 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                </div>
              )}
              {order.estado === 'aceptado' && (
                <div className="relative flex h-10 w-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400/20 opacity-75"></span>
                  <div className="relative rounded-full h-10 w-10 bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <CheckCircle2 className="w-5 h-5 animate-pulse" />
                  </div>
                </div>
              )}
              {order.estado === 'en_preparacion' && (
                <div className="relative flex h-12 w-12 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-brand-500/20 border-t-brand-400 animate-spin"></div>
                  <div className="rounded-full h-9 w-9 bg-brand-500/10 flex items-center justify-center text-brand-400">
                    <ChefHat className="w-5 h-5 animate-bounce" />
                  </div>
                </div>
              )}
              {order.estado === 'listo' && (
                <div className="relative flex h-12 w-12 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-brand-400/20 opacity-75"></span>
                  <div className="relative rounded-full h-10 w-10 bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                    <Truck className="w-5 h-5 animate-bounce" />
                  </div>
                </div>
              )}
              {order.estado === 'entregado' && (
                <div className="rounded-full h-10 w-10 bg-brand-500/15 border border-brand-500 flex items-center justify-center text-brand-400 shadow-lg shadow-brand-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              {order.estado === 'cancelado' && (
                <div className="rounded-full h-10 w-10 bg-rose-500/15 border border-rose-500 flex items-center justify-center text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="text-center relative z-10 space-y-1">
              <span className="block text-[10px] font-mono-tech font-bold uppercase tracking-wider text-slate-400">
                {getStatusLabel()}
              </span>
              <p className="text-sm font-display font-extrabold text-white">
                {getStatusDescription()}
              </p>
            </div>
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
                        ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white border-brand-400 shadow-lg shadow-brand-500/30 scale-105'
                        : 'bg-slate-950 text-slate-600 border-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[11px] font-display font-extrabold text-center ${
                      isCompleted ? 'text-brand-400' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.timestamp && isCompleted && (
                    <span className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
                      {formatTime(step.timestamp)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumen de Detalles */}
        <div className="glass-card p-5 md:p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <h3 className="font-display font-black text-sm text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-400" /> Detalle de la Compra
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
              <span className="font-semibold text-brand-400">{formatDeliveryType(order.tipo_entrega)}</span>
            </div>
            {order.cliente_direccion && (
              <div className="flex justify-between">
                <span className="text-slate-400">Dirección Cuenca:</span>
                <span className="text-right max-w-[200px] truncate">{order.cliente_direccion}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-slate-400">Forma de pago:</span>
              <PaymentBadge status={order.estado_pago} method={order.metodo_pago} />
            </div>
          </div>

          {/* Facturación Ecuador */}
          {order.requiere_factura && order.datos_facturacion && (
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/5 text-xs space-y-1">
              <p className="font-display font-bold text-brand-400">Factura solicitada a:</p>
              <p><span className="text-slate-400">{order.datos_facturacion.tipo_doc}:</span> {order.datos_facturacion.num_doc}</p>
              <p><span className="text-slate-400">Nombre:</span> {order.datos_facturacion.razon_social}</p>
              <p><span className="text-slate-400">Email:</span> {order.datos_facturacion.email}</p>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-white/10">
            <span>Total Pagado / A Cobrar:</span>
            <span className="text-lg font-mono-tech text-brand-400">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Botón WhatsApp del Negocio */}
        <a
          href={`https://wa.me/${business.telefono_whatsapp}?text=Hola,%20quisiera%20consultar%20sobre%20mi%20pedido%20%23${order.numero_pedido}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 px-5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-brand-600/25 active:scale-98 transition-all"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Contactar a {business.nombre} por WhatsApp</span>
        </a>
      </main>
    </div>
  );
}
