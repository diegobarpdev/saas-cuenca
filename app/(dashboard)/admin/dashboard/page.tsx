'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Printer, MessageSquare, Clock, Eye, X, Plus } from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types/database';
import { OrderBadge, PaymentBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/currency';
import { TicketThermal } from '@/components/ticket/TicketThermal';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';

export default function AdminDashboardPage() {
  const { business, loading: loadingBusiness } = useAdminBusiness();

  // Hook de Tiempo Real (Suscrito a Supabase Realtime Websockets)
  const { orders, soundEnabled, setSoundEnabled, addOrderLocal, updateOrderStatusLocal } =
    useRealtimeOrders(business?.id || '');

  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [selectedOrderForTicket, setSelectedOrderForTicket] = useState<Order | null>(null);
  const [selectedComprobanteUrl, setSelectedComprobanteUrl] = useState<string | null>(null);

  // Cambiar estado de pedido (se propaga en tiempo real)
  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatusLocal(orderId, newStatus);
  };

  // Simular la llegada de un pedido entrante en tiempo real (para pruebas locales)
  const handleSimulateIncomingOrder = () => {
    if (!business) return;
    const randomOrderNumber = Math.floor(Math.random() * 900) + 50;
    const newMockOrder: Order = {
      id: `ord-sim-${Date.now()}`,
      business_id: business.id,
      numero_pedido: randomOrderNumber,
      cliente_nombre: 'María Augusta Vega',
      cliente_telefono: '0998765432',
      cliente_direccion: 'Calle Larga y Benigno Malo, Dpto 2A',
      latitud: -2.901,
      longitud: -79.005,
      tipo_entrega: 'domicilio',
      numero_mesa: null,
      costo_envio: 1.50,
      subtotal: 5.25,
      total: 6.75,
      metodo_pago: 'payphone',
      estado_pago: 'pagado',
      comprobante_pago_url: null,
      payphone_transaction_id: `PYP-${Math.floor(Math.random() * 899999 + 100000)}`,
      requiere_factura: true,
      datos_facturacion: {
        tipo_doc: 'CEDULA',
        num_doc: '0104591284',
        razon_social: 'MARIA AUGUSTA VEGA',
        email: 'maria.vega@gmail.com',
        direccion: 'Cuenca, Ecuador',
      },
      estado: 'pendiente',
      created_at: new Date().toISOString(),
    };

    addOrderLocal(newMockOrder);
  };

  // Filtrado de pedidos
  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'todos') return true;
    return o.estado === activeFilter;
  });

  // Imprimir ticket
  const handlePrint = () => {
    window.print();
  };

  if (loadingBusiness || !business) {
    return (
      <div className="p-12 text-center text-slate-400 font-display text-sm">
        Cargando datos en tiempo real desde Supabase Postgres...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D1322] p-5 rounded-3xl border border-white/10 glass-panel">
        <div>
          <h1 className="text-xl font-display font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Pedidos en Tiempo Real — {business.nombre}</span>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Canal de Websockets activo. Notificaciones sonoras e impresión térmica de comandas en vivo.
          </p>
        </div>

        {/* Acciones Header */}
        <div className="flex items-center gap-2">
          {/* Botón Simular Pedido Entrante */}
          <button
            onClick={handleSimulateIncomingOrder}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-display font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all border border-emerald-400/30"
            title="Simula que un cliente envió un pedido por la web"
          >
            <Plus className="w-4 h-4" />
            <span>Simular Pedido Entrante 🔔</span>
          </button>

          {/* Control de Sonido */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sonido Activo' : 'Silenciado'}</span>
          </button>
        </div>
      </div>

      {/* Filtros por Estado */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'todos', label: 'Todos los Pedidos' },
          { id: 'pendiente', label: 'Pendientes' },
          { id: 'aceptado', label: 'Aceptados' },
          { id: 'en_preparacion', label: 'En Preparación' },
          { id: 'listo', label: 'Listos / En Camino' },
        ].map((tab) => {
          const count = tab.id === 'todos' ? orders.length : orders.filter((o) => o.estado === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-display font-extrabold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid de Pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-3xl border border-slate-800 text-slate-500">
          <p className="font-display font-semibold text-sm">No hay pedidos recibidos en este filtro aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="glass-card rounded-3xl p-5 space-y-4 shadow-xl border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
            >
              {/* Header de Tarjeta */}
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono-tech font-black text-xl text-white">
                      #{String(order.numero_pedido).padStart(4, '0')}
                    </span>
                    <OrderBadge status={order.estado} />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Tipo: <strong className="text-emerald-400 uppercase font-display">{order.tipo_entrega}</strong></span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-mono-tech font-black text-lg text-emerald-400">{formatCurrency(order.total)}</span>
                  <div className="mt-0.5">
                    <PaymentBadge status={order.estado_pago} method={order.metodo_pago} />
                  </div>
                </div>
              </div>

              {/* Datos de Cliente */}
              <div className="space-y-1.5 text-xs text-slate-300">
                <p><strong className="text-white font-display">Cliente:</strong> {order.cliente_nombre} ({order.cliente_telefono})</p>
                {order.cliente_direccion && (
                  <p><strong className="text-white font-display">Dirección Cuenca:</strong> {order.cliente_direccion}</p>
                )}
                {order.numero_mesa && (
                  <p><strong className="text-white font-display">Mesa:</strong> {order.numero_mesa}</p>
                )}
              </div>

              {/* Facturación ECUADOR */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 text-[11px] space-y-1">
                <p className="font-display font-bold text-slate-200">Datos Facturación Ecuador:</p>
                {order.requiere_factura && order.datos_facturacion ? (
                  <div className="text-slate-400 space-y-0.5">
                    <p><span className="text-slate-200 font-semibold">{order.datos_facturacion.tipo_doc}:</span> {order.datos_facturacion.num_doc}</p>
                    <p><span className="text-slate-200 font-semibold">Razón Social:</span> {order.datos_facturacion.razon_social}</p>
                    <p><span className="text-slate-200 font-semibold">Email:</span> {order.datos_facturacion.email}</p>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Consumidor Final</p>
                )}
              </div>

              {/* Botón Comprobante */}
              {order.comprobante_pago_url && (
                <button
                  onClick={() => setSelectedComprobanteUrl(order.comprobante_pago_url)}
                  className="w-full py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-display font-semibold border border-sky-500/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Comprobante Transferencia / Deuna!</span>
                </button>
              )}

              {/* Acciones del Pedido */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                {/* Botón Imprimir Ticket Thermal */}
                <button
                  onClick={() => setSelectedOrderForTicket(order)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-display font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Imprimir Ticket</span>
                </button>

                {/* Notificación WA */}
                <a
                  href={`https://wa.me/${order.cliente_telefono}?text=Hola%20${encodeURIComponent(order.cliente_nombre)},%20tu%20pedido%20%23${order.numero_pedido}%20en%20${encodeURIComponent(business.nombre)}%20ha%20cambiado%20a:%20${order.estado}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-display font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Avisar WA</span>
                </a>

                {/* Cambiador de Estado */}
                <div className="flex items-center gap-1 ml-auto">
                  {order.estado === 'pendiente' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'aceptado')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-display font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      Aceptar Pedido
                    </button>
                  )}
                  {order.estado === 'aceptado' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'en_preparacion')}
                      className="px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-display font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all"
                    >
                      En Preparación
                    </button>
                  )}
                  {order.estado === 'en_preparacion' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'listo')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-display font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      Marcar Listo
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Impresión Ticket Thermal */}
      {selectedOrderForTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="font-display font-extrabold text-white text-base">Vista Previa Ticket POS (58/80mm)</h3>
              <button
                onClick={() => setSelectedOrderForTicket(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-2 rounded-xl overflow-hidden shadow-inner">
              <TicketThermal
                order={selectedOrderForTicket}
                business={business}
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setSelectedOrderForTicket(null)}
                className="flex-1 py-3 rounded-2xl border border-slate-700 text-slate-300 text-xs font-display font-bold"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-display font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket POS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Comprobante */}
      {selectedComprobanteUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 p-5 rounded-3xl border border-white/10 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="font-display font-bold text-white text-sm">Comprobante de Pago Subido por Cliente</h3>
              <button
                onClick={() => setSelectedComprobanteUrl(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-slate-800">
              <img
                src={selectedComprobanteUrl}
                alt="Comprobante"
                className="w-full h-full object-contain bg-slate-950"
              />
            </div>

            <button
              onClick={() => setSelectedComprobanteUrl(null)}
              className="w-full py-3 rounded-2xl bg-slate-800 text-slate-200 text-xs font-display font-bold"
            >
              Cerrar Vista
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
