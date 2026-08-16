'use client';

import React from 'react';
import { Order, OrderItem, Business } from '@/lib/types/database';
import { formatCurrency, formatDeliveryType, formatPaymentMethod } from '@/lib/utils/currency';

interface TicketThermalProps {
  order: Order & { items?: OrderItem[] };
  business: Business;
}

export function TicketThermal({ order, business }: TicketThermalProps) {
  const formattedDate = new Date(order.created_at).toLocaleString('es-EC', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div className="ticket-printable bg-white text-black p-4 max-w-[80mm] mx-auto font-mono text-xs leading-tight border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0">
      {/* Encabezado del Negocio */}
      <div className="text-center pb-2 border-b border-dashed border-black">
        <h2 className="font-bold text-sm uppercase">{business.nombre}</h2>
        {business.ruc && <p className="text-[10px]">RUC: {business.ruc}</p>}
        {business.direccion && <p className="text-[10px]">{business.direccion}</p>}
        <p className="text-[10px]">Telf: {business.telefono_whatsapp}</p>
      </div>

      {/* Cabecera del Pedido */}
      <div className="py-2 border-b border-dashed border-black">
        <div className="flex justify-between items-center text-sm font-bold">
          <span>PEDIDO #{String(order.numero_pedido).padStart(4, '0')}</span>
          <span className="uppercase text-xs font-bold">{formatDeliveryType(order.tipo_entrega)}</span>
        </div>
        <p className="text-[10px] text-gray-700">Fecha: {formattedDate}</p>
        {order.numero_mesa && (
          <p className="font-bold text-xs mt-0.5">MESA: {order.numero_mesa}</p>
        )}
      </div>

      {/* Datos del Cliente */}
      <div className="py-2 border-b border-dashed border-black">
        <p className="font-bold">CLIENTE:</p>
        <p>{order.cliente_nombre}</p>
        <p>Telf: {order.cliente_telefono}</p>
        {order.cliente_direccion && (
          <p className="text-[10px] mt-0.5">Dir: {order.cliente_direccion}</p>
        )}
      </div>

      {/* Datos de Facturación (Ecuador) */}
      <div className="py-2 border-b border-dashed border-black">
        <p className="font-bold">FACTURACIÓN:</p>
        {order.requiere_factura && order.datos_facturacion ? (
          <>
            <p><span className="font-semibold">{order.datos_facturacion.tipo_doc}:</span> {order.datos_facturacion.num_doc}</p>
            <p><span className="font-semibold">NOMBRE:</span> {order.datos_facturacion.razon_social}</p>
            <p className="text-[10px]"><span className="font-semibold">EMAIL:</span> {order.datos_facturacion.email}</p>
          </>
        ) : (
          <p className="font-semibold">SIN FACTURA</p>
        )}
      </div>

      {/* Lista de Productos */}
      <div className="py-2 border-b border-dashed border-black">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-black text-[10px]">
              <th className="pb-1">CANT</th>
              <th className="pb-1">DESCRIPCIÓN</th>
              <th className="pb-1 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {order.items && order.items.length > 0 ? (
              order.items.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="py-1 font-bold">{item.cantidad}x</td>
                  <td className="py-1 pr-1">
                    {item.product?.nombre || (item as any).product_name || (item as any).nombre || 'Producto'}
                    {item.notas && <p className="text-[9px] italic text-gray-700">({item.notas})</p>}
                  </td>
                  <td className="py-1 text-right font-semibold">
                    {formatCurrency(item.precio_unitario * item.cantidad)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-1 text-center italic text-gray-500">Sin detalles de items</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="py-2 border-b border-dashed border-black text-right">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        {order.costo_envio > 0 && (
          <div className="flex justify-between">
            <span>Costo de Envío:</span>
            <span>{formatCurrency(order.costo_envio)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t border-black">
          <span>TOTAL A PAGAR:</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      {/* Método de Pago */}
      <div className="py-2 text-center">
        <p className="font-bold text-xs uppercase">PAGO: {formatPaymentMethod(order.metodo_pago)}</p>
        <p className="text-[10px] uppercase">{order.estado_pago === 'pagado' ? 'COBRADO' : 'PENDIENTE DE COBRO'}</p>
        {order.payphone_transaction_id && (
          <p className="text-[9px]">ID PayPhone: {order.payphone_transaction_id}</p>
        )}
      </div>

      {/* Pie del Ticket */}
      <div className="pt-2 text-center text-[10px] border-t border-dashed border-black mt-2">
        <p className="font-bold">¡Gracias por su preferencia!</p>
        <p className="text-[9px] text-gray-600 mt-0.5">Comprobante sin validez tributaria directa</p>
      </div>
    </div>
  );
}
