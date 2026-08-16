'use client';

import React, { useState, useEffect, use } from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, ArrowLeft, Clock, CheckCircle2, MessageSquare, Tv, ChefHat, AlertCircle, RefreshCw } from 'lucide-react';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { Order, OrderStatus } from '@/lib/types/database';
import { formatCurrency, formatDeliveryType } from '@/lib/utils/currency';
import { toast } from '@/lib/utils/toast';
import Link from 'next/link';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function AdminKDSPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const { business, loading: loadingBusiness } = useAdminBusiness(slug);
  const { orders, soundEnabled, setSoundEnabled, updateOrderStatusLocal } = useRealtimeOrders(business?.id || '');

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [lastFinishedOrder, setLastFinishedOrder] = useState<{ id: string; num: number; prevStatus: OrderStatus } | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<{ id: string; num: number } | null>(null);

  const [simulatedRole, setSimulatedRole] = useState<'dueño' | 'cajero-1' | 'cajero-2' | 'cocinero'>('cocinero');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = (localStorage.getItem('kaltiro_simulated_role') || 'dueño') as any;
      setSimulatedRole(role);
    }
  }, []);

  // Actualizar el tiempo actual para los contadores
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000); // Cada 10s
    return () => clearInterval(timer);
  }, []);

  // Manejar pantalla completa
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Error al entrar a pantalla completa:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const getMinutesElapsed = (createdAtStr: string) => {
    const diffMs = now.getTime() - new Date(createdAtStr).getTime();
    return Math.floor(diffMs / 60000);
  };

  const getElapsedTimeLabel = (createdAtStr: string) => {
    const mins = getMinutesElapsed(createdAtStr);
    if (mins < 1) return 'Hace un momento';
    return `Hace ${mins} min`;
  };

  const getTimeColor = (createdAtStr: string) => {
    const mins = getMinutesElapsed(createdAtStr);
    if (mins < 10) return 'text-brand-400 bg-brand-500/10 border-brand-500/20';
    if (mins < 20) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20 border animate-pulse';
  };

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus, orderNum: number, currentStatus?: OrderStatus) => {
    if (newStatus === 'listo' && currentStatus) {
      setLastFinishedOrder({ id: orderId, num: orderNum, prevStatus: currentStatus });
    }
    updateOrderStatusLocal(orderId, newStatus);
    toast.success(`Pedido #${String(orderNum).padStart(4, '0')} cambiado a: ${
      newStatus === 'aceptado' ? 'ACEPTADO' : newStatus === 'en_preparacion' ? 'EN COCINA' : 'LISTO'
    }`);
  };

  const handleCancelOrder = (orderId: string, orderNum: number) => {
    setOrderToCancel({ id: orderId, num: orderNum });
  };

  if (loadingBusiness) {
    return (
      <div className="h-full flex items-center justify-center gap-2 text-slate-400 bg-[#070A11]">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-400" />
        <span className="font-display text-sm font-semibold">Cargando monitor de cocina KDS...</span>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-slate-400 bg-[#070A11]">
        No se pudo cargar la información del negocio.
      </div>
    );
  }

  // Si el negocio NO tiene contratado el Add-on de cocina/sonido
  if (!business.has_live_kitchen) {
    return (
      <div className="min-h-[calc(100vh-4rem)] md:min-h-screen flex items-center justify-center p-4 bg-[#070A11] relative overflow-hidden">
        {/* Glow ambient background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-md w-full bg-[#0D1322]/90 border border-white/10 p-8 rounded-3xl text-center space-y-6 shadow-2xl relative z-10 backdrop-blur-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Tv className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-display font-black text-white tracking-tight">Monitor de Cocina KDS</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Digitaliza tu cocina con una pantalla interactiva dedicada exclusivamente para la preparación de pedidos en tiempo real. Organiza a tus cocineros y acelera los despachos.
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 text-left text-xs space-y-2.5 text-slate-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span><strong>Alertas sonoras (timbre fuerte)</strong> instantáneas cuando entra un pedido.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span><strong>Controles táctiles gigantes</strong> idóneos para Tablets y Smart TVs en cocina.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span><strong>Semáforo de alertas de tiempo</strong> para evitar que se te enfríen los pedidos.</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <a
              href={`https://wa.me/593969307527?text=${encodeURIComponent(
                `Hola! Soy de ${business.nombre} (/${business.slug}). Me gustaría activar el módulo Add-on de Monitor de Cocina KDS (+$7/mes) en Kaltiro.com.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-display font-bold text-xs text-center shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 border border-purple-400/30"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Activar Monitor KDS (+$7/mes)</span>
            </a>
            
            <Link
              href={`/${slug}/admin/dashboard`}
              className="py-2.5 text-xs text-slate-400 hover:text-white font-medium transition-colors"
            >
              Volver al Panel Principal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar pedidos activos para cocina (pendiente, aceptado, en_preparacion, listo)
  const activeKitchenOrders = orders
    .filter((o) => o.estado === 'pendiente' || o.estado === 'aceptado' || o.estado === 'en_preparacion' || o.estado === 'listo')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // Del más antiguo al más nuevo — primero en entrar, primero en salir

  return (
    <div className="h-full flex flex-col bg-[#070A11] text-slate-100 overflow-hidden w-full select-none">
      
      {/* Header del KDS */}
      <header className="h-16 border-b border-white/10 bg-[#0B0F1B] px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          {simulatedRole === 'dueño' && (
            <Link
              href={`/${slug}/admin/dashboard`}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Volver al panel"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-brand-400" />
            <h1 className="font-display font-black text-sm md:text-base tracking-tight text-white">
              Monitor de Cocina KDS
            </h1>
            <span className="hidden sm:inline-block text-[10px] font-mono-tech font-bold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/25">
              En Vivo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Indicador de pedidos pendientes */}
          <div className="px-3 py-1 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono font-bold text-slate-300">
            En Cola: <span className="text-brand-400">{activeKitchenOrders.length}</span>
          </div>

          {/* Control de sonido de timbre */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
              soundEnabled
                ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                : 'bg-slate-900 border-white/10 text-slate-500'
            }`}
            title={soundEnabled ? 'Silenciar alarma' : 'Activar alarma'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-brand-400" />
                <span className="hidden md:inline">Alarma Activa</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="hidden md:inline">Alarma Silenciada</span>
              </>
            )}
          </button>

          {/* Pantalla completa */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Grid del KDS */}
      <main className="flex-1 p-4 overflow-x-auto overflow-y-hidden bg-[#070A11] flex gap-4 scrollbar-thin">
        {activeKitchenOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
              <ChefHat className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-sm text-slate-300">¡Cocina al día!</h3>
              <p className="text-xs text-slate-500">No hay pedidos pendientes de preparación.</p>
            </div>
          </div>
        ) : (
          activeKitchenOrders.map((order) => (
            <div
              key={order.id}
              className={`w-80 shrink-0 h-full rounded-2xl border flex flex-col justify-between overflow-hidden shadow-2xl ${
                order.estado === 'pendiente'
                  ? 'border-amber-500/40 bg-[#0E1528]/95 ring-2 ring-amber-500/20'
                  : order.estado === 'aceptado'
                  ? 'border-indigo-500/40 bg-[#0F102B]/95'
                  : 'border-brand-500/40 bg-[#0E1B15]/95'
              }`}
            >
              {/* Header de Tarjeta */}
              <div className="p-3.5 border-b border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-white">
                      #{String(order.numero_pedido).padStart(4, '0')}
                    </span>
                    <button
                      onClick={() => handleCancelOrder(order.id, order.numero_pedido)}
                      className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 font-bold transition-all cursor-pointer"
                      title="Rechazar/Cancelar Pedido"
                    >
                      Rechazar
                    </button>
                  </div>
                  
                  {/* Semáforo de Tiempo Transcurrido */}
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border flex items-center gap-1.5 ${getTimeColor(order.created_at)}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{getElapsedTimeLabel(order.created_at)}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span className="capitalize font-semibold text-slate-200">
                    {formatDeliveryType(order.tipo_entrega)}
                  </span>
                  {order.numero_mesa ? (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold font-display">
                      Mesa {order.numero_mesa}
                    </span>
                  ) : (
                    <span className="text-slate-400 truncate max-w-[140px]">{order.cliente_nombre}</span>
                  )}
                </div>
              </div>

              {/* Items del Pedido (Scrollable) */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 scrollbar-thin">
                {(order as any).items && (order as any).items.length > 0 ? (
                  <ul className="space-y-3.5">
                    {(order as any).items.map((item: any, idx: number) => (
                      <li key={item.id || idx} className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm text-slate-100 font-medium leading-tight">
                            <span className="font-mono font-black text-amber-400 text-base mr-2 bg-amber-400/10 px-1.5 py-0.5 rounded-lg border border-amber-400/20">
                              {item.cantidad}
                            </span>
                            {item.product?.nombre || item.product_name || 'Producto'}
                          </span>
                        </div>
                        {item.notas && (
                          <div className="ml-10 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-300 text-xs font-semibold border border-red-500/20 flex items-start gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
                            <span>Nota: {item.notas}</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">No se pudo cargar el desglose de productos.</p>
                )}
              </div>

              {/* Acciones de la Tarjeta */}
              <div className="p-3 border-t border-white/5 bg-black/30 shrink-0">
                {order.estado === 'pendiente' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'aceptado', order.numero_pedido, order.estado)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-display font-black text-xs tracking-tight shadow-lg shadow-amber-500/15"
                  >
                    ACEPTAR PEDIDO
                  </button>
                )}

                {order.estado === 'aceptado' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'pendiente', order.numero_pedido, order.estado)}
                      className="px-3.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                      title="Regresar a Pendiente"
                    >
                      Regresar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'en_preparacion', order.numero_pedido, order.estado)}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-display font-black text-xs tracking-tight shadow-lg shadow-indigo-500/20 border border-indigo-400/20"
                    >
                      EMPEZAR COCINA
                    </button>
                  </div>
                )}

                {order.estado === 'en_preparacion' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'aceptado', order.numero_pedido, order.estado)}
                      className="px-3.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                      title="Regresar a Aceptado"
                    >
                      Regresar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'listo', order.numero_pedido, order.estado)}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-slate-950 font-display font-black text-xs tracking-tight shadow-lg shadow-brand-500/15"
                    >
                      PEDIDO LISTO
                    </button>
                  </div>
                )}

                {order.estado === 'listo' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'en_preparacion', order.numero_pedido, order.estado)}
                      className="px-3.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                      title="Regresar a Preparación"
                    >
                      Regresar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'entregado', order.numero_pedido, order.estado)}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-slate-950 font-display font-black text-xs tracking-tight shadow-lg shadow-brand-500/15"
                    >
                      ENTREGAR PEDIDO
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Alerta flotante para deshacer acción de pedido Listo */}
      {lastFinishedOrder && (
        <div className="fixed bottom-6 right-6 bg-[#0D1322] border border-brand-500/40 p-4 rounded-2xl shadow-2xl flex items-center gap-4 z-40 animate-slide-up">
          <div className="text-xs">
            <p className="text-white font-bold">Pedido #{String(lastFinishedOrder.num).padStart(4, '0')} marcado como Listo</p>
            <p className="text-slate-400">Se quitó de la pantalla de cocina.</p>
          </div>
          <button
            onClick={() => {
              updateOrderStatusLocal(lastFinishedOrder.id, lastFinishedOrder.prevStatus);
              toast.info(`Pedido #${String(lastFinishedOrder.num).padStart(4, '0')} regresó a la cocina.`);
              setLastFinishedOrder(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Deshacer
          </button>
          <button
            onClick={() => setLastFinishedOrder(null)}
            className="text-slate-400 hover:text-slate-200 text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Modal Dialog para Confirmar Cancelación/Rechazo */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1322] border border-red-500/30 p-6 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl relative overflow-hidden animate-zoom-in">
            {/* Glow background */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-500/10 rounded-full blur-2xl"></div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-display font-black text-white">¿Rechazar Pedido #{String(orderToCancel.num).padStart(4, '0')}?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Esta acción cancelará el pedido de forma definitiva en el sistema y se notificará el cambio de estado al cliente. No podrás revertir esta acción.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setOrderToCancel(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                No, mantener
              </button>
              <button
                onClick={() => {
                  updateOrderStatusLocal(orderToCancel.id, 'cancelado');
                  toast.info(`Pedido #${String(orderToCancel.num).padStart(4, '0')} ha sido rechazado.`);
                  setOrderToCancel(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/20 cursor-pointer border border-red-500/30"
              >
                Sí, rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selector de Roles Simulador (Discreto en la esquina) */}
      <div className="fixed bottom-3 right-3 z-50 group">
        <details className="relative">
          <summary className="list-none cursor-pointer px-2.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/10 text-amber-400 hover:text-amber-300 text-[11px] font-mono-tech font-bold shadow-xl flex items-center gap-1.5 transition-all active:scale-95">
            <span>⚡</span>
            <span className="hidden sm:inline">Simulador</span>
            <span className="text-[10px] text-slate-400">({simulatedRole})</span>
          </summary>
          
          <div className="absolute bottom-full right-0 mb-2 p-2 rounded-2xl bg-[#0B0F1B]/95 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-1.5 w-48 animate-in fade-in zoom-in-95 duration-150">
            <span className="block text-[10px] font-mono-tech font-bold text-amber-400 px-2 py-0.5">
              Cambiar Rol Simulación:
            </span>
            {[
              { value: 'dueño', label: 'Dueño / Admin' },
              { value: 'cajero-1', label: 'Cajero 1 (Principal)' },
              { value: 'cajero-2', label: 'Cajero 2 (Barra)' },
              { value: 'cocinero', label: 'Cocinero (KDS)' }
            ].map((roleOpt) => (
              <button
                key={roleOpt.value}
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('kaltiro_simulated_role', roleOpt.value);
                    if (roleOpt.value === 'cocinero') {
                      window.location.href = `/${slug}/cocina`;
                    } else if (roleOpt.value.startsWith('cajero')) {
                      window.location.href = `/${slug}/caja`;
                    } else {
                      window.location.href = `/${slug}/admin/dashboard`;
                    }
                  }
                }}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  simulatedRole === roleOpt.value
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {roleOpt.label}
              </button>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
