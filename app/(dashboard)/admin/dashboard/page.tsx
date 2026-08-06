'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Printer, MessageSquare, Clock, Eye, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Order, OrderStatus } from '@/lib/types/database';
import { OrderBadge, PaymentBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/currency';
import { TicketThermal } from '@/components/ticket/TicketThermal';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';

export default function AdminDashboardPage() {
  const { business, loading: loadingBusiness } = useAdminBusiness();

  const { orders, soundEnabled, setSoundEnabled, addOrderLocal, updateOrderStatusLocal } =
    useRealtimeOrders(business?.id || '');

  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [selectedOrderForTicket, setSelectedOrderForTicket] = useState<Order | null>(null);
  const [selectedComprobanteUrl, setSelectedComprobanteUrl] = useState<string | null>(null);

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatusLocal(orderId, newStatus);
    const orderObj = orders.find((o) => o.id === orderId);
    const num = orderObj ? `#${orderObj.numero_pedido}` : '';
    toast.success(`Pedido ${num} actualizado a: ${newStatus.toUpperCase()}`);
  };

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
    toast.info(`¡Nuevo pedido entrante #${randomOrderNumber}!`, {
      description: 'Cliente: María Augusta Vega ($6.75)',
    });
  };

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'todos') return true;
    return o.estado === activeFilter;
  });

  const handlePrint = () => {
    window.print();
  };

  if (loadingBusiness || !business) {
    return (
      <div className="p-12 text-center text-zinc-400 text-xs">
        Cargando pedidos en tiempo real...
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header Producción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <span>Pedidos en Tiempo Real</span>
            <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {business.nombre}
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitoreo continuo via Websockets con avisos sonoros e impresión térmica POS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateIncomingOrder}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simular Pedido</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              soundEnabled
                ? 'bg-zinc-800 border-zinc-700 text-emerald-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sonido Activo' : 'Silenciado'}</span>
          </button>
        </div>
      </div>

      {/* Filtros por Estado */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'todos', label: 'Todos' },
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === tab.id
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid de Pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-zinc-800/80 bg-zinc-900/30 text-zinc-500 text-xs font-medium">
          No hay pedidos registrados en este estado.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between gap-3"
            >
              {/* Header de Tarjeta */}
              <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-zinc-100">
                      #{String(order.numero_pedido).padStart(4, '0')}
                    </span>
                    <OrderBadge status={order.estado} />
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>Entrega: <strong className="text-zinc-200 uppercase font-mono">{order.tipo_entrega}</strong></span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-base text-zinc-100">{formatCurrency(order.total)}</span>
                  <div className="mt-0.5">
                    <PaymentBadge status={order.estado_pago} method={order.metodo_pago} />
                  </div>
                </div>
              </div>

              {/* Datos de Cliente */}
              <div className="space-y-1 text-xs text-zinc-300">
                <p><strong className="text-zinc-200">Cliente:</strong> {order.cliente_nombre} ({order.cliente_telefono})</p>
                {order.cliente_direccion && (
                  <p><strong className="text-zinc-200">Dirección:</strong> {order.cliente_direccion}</p>
                )}
                {order.numero_mesa && (
                  <p><strong className="text-zinc-200">Mesa:</strong> {order.numero_mesa}</p>
                )}
              </div>

              {/* Facturación ECUADOR */}
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] space-y-0.5">
                <p className="font-semibold text-zinc-300">Datos Facturación Ecuador:</p>
                {order.requiere_factura && order.datos_facturacion ? (
                  <div className="text-zinc-400 space-y-0.5">
                    <p><span className="text-zinc-200">{order.datos_facturacion.tipo_doc}:</span> {order.datos_facturacion.num_doc}</p>
                    <p><span className="text-zinc-200">Razón Social:</span> {order.datos_facturacion.razon_social}</p>
                    <p><span className="text-zinc-200">Email:</span> {order.datos_facturacion.email}</p>
                  </div>
                ) : (
                  <p className="text-zinc-500 italic">Consumidor Final</p>
                )}
              </div>

              {/* Comprobante */}
              {order.comprobante_pago_url && (
                <button
                  onClick={() => setSelectedComprobanteUrl(order.comprobante_pago_url)}
                  className="w-full py-1.5 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-sky-400 text-xs font-medium border border-zinc-800 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Comprobante Transferencia / Deuna!</span>
                </button>
              )}

              {/* Acciones del Pedido */}
              <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedOrderForTicket(order)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Imprimir Ticket</span>
                </button>

                <a
                  href={`https://wa.me/${order.cliente_telefono}?text=Hola%20${encodeURIComponent(order.cliente_nombre)},%20tu%20pedido%20%23${order.numero_pedido}%20en%20${encodeURIComponent(business.nombre)}%20ha%20cambiado%20a:%20${order.estado}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-emerald-400 text-xs font-medium border border-zinc-800 flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Avisar WA</span>
                </a>

                {/* Transición de Estado */}
                <div className="flex items-center gap-1 ml-auto">
                  {order.estado === 'pendiente' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'aceptado')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors"
                    >
                      Aceptar Pedido
                    </button>
                  )}
                  {order.estado === 'aceptado' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'en_preparacion')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-colors"
                    >
                      En Preparación
                    </button>
                  )}
                  {order.estado === 'en_preparacion' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'listo')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors"
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
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="font-semibold text-zinc-100 text-sm">Vista Previa Ticket POS (58/80mm)</h3>
              <button
                onClick={() => setSelectedOrderForTicket(null)}
                className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white p-2 rounded-lg overflow-hidden">
              <TicketThermal order={selectedOrderForTicket} business={business} />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedOrderForTicket(null)}
                className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-xs font-medium hover:bg-zinc-800 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Comprobante */}
      {selectedComprobanteUrl && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="font-semibold text-zinc-100 text-sm">Comprobante de Pago Subido por Cliente</h3>
              <button
                onClick={() => setSelectedComprobanteUrl(null)}
                className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full h-80 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
              <img
                src={selectedComprobanteUrl}
                alt="Comprobante"
                className="w-full h-full object-contain"
              />
            </div>

            <button
              onClick={() => setSelectedComprobanteUrl(null)}
              className="w-full py-2 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-medium hover:bg-zinc-700 transition-colors"
            >
              Cerrar Vista
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
