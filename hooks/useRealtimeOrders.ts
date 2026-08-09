'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order, OrderStatus, PaymentStatus } from '@/lib/types/database';
import { MOCK_INITIAL_ORDERS } from '@/lib/supabase/mock-data';
import { toast } from '@/lib/utils/toast';

export function useRealtimeOrders(businessId: string, initialOrders: Order[] = []) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const channelRef = useRef<any>(null);

  // Inicializar audio de notificación
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    }
  }, []);

  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch((e) => console.log('Audio bloqueado:', e));
    }
  };

  useEffect(() => {
    if (!businessId) return;

    // BroadcastChannel local aislado por inquilino para sincronizar ventanas locales al instante
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(`yapi-orders-bc-${businessId}`);
      broadcastRef.current = bc;
      
      bc.onmessage = (event) => {
        if (event.data?.type === 'ORDER_STATUS_CHANGED') {
          const timestampKey = `${event.data.newStatus}_at`;
          setOrders((prev) =>
            prev.map((order) =>
              order.id === event.data.orderId ? { ...order, estado: event.data.newStatus, [timestampKey]: event.data.timestamp } : order
            )
          );
        } else if (event.data?.type === 'ORDER_PAYMENT_STATUS_CHANGED') {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === event.data.orderId ? { ...order, estado_pago: event.data.newPaymentStatus } : order
            )
          );
        } else if (event.data?.type === 'NEW_ORDER_CREATED') {
          setOrders((prev) => [event.data.order, ...prev]);
          playNotificationSound();
        }
      };
    }

    // Si hay cliente Supabase real en producción
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      const supabase = createClient();

      const fetchOrders = async () => {
        const { data, error } = await supabase
          .from('orders')
          .select('*, items:order_items(*, product:products(*))')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setOrders(data as Order[]);
        }
      };

      fetchOrders();

      const channelName = `yapi-orders-${businessId}`;
      const existingChannel = supabase.getChannels().find((ch: any) => ch.topic === `realtime:${channelName}`);
      if (existingChannel) {
        supabase.removeChannel(existingChannel);
      }

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `business_id=eq.${businessId}`
          },
          (payload: any) => {
            const newOrder = payload.new as Order;
            if (!newOrder) return;
            setOrders((prev) => {
              const exists = prev.some((o) => o.id === newOrder.id);
              if (exists) return prev;
              return [newOrder, ...prev];
            });
            playNotificationSound();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `business_id=eq.${businessId}`
          },
          (payload: any) => {
            const updatedOrder = payload.new as Order;
            if (!updatedOrder) return;
            setOrders((prev) =>
              prev.map((order) => (order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order))
            );
          }
        )
        .on(
          'broadcast',
          { event: 'NEW_ORDER' },
          (payload: any) => {
            const newOrder = payload.payload as Order;
            if (!newOrder) return;
            if (businessId && newOrder.business_id && newOrder.business_id !== businessId) return;
            setOrders((prev) => {
              const exists = prev.some((o) => o.id === newOrder.id);
              if (exists) return prev;
              return [newOrder, ...prev];
            });
            playNotificationSound();
          }
        )
        .on(
          'broadcast',
          { event: 'ORDER_STATUS_CHANGED' },
          (payload: any) => {
            const data = payload.payload;
            if (data && data.orderId) {
              const timestampKey = `${data.newStatus}_at`;
              setOrders((prev) =>
                prev.map((order) => (order.id === data.orderId ? { ...order, estado: data.newStatus, [timestampKey]: data.timestamp } : order))
              );
            }
          }
        )
        .on(
          'broadcast',
          { event: 'ORDER_PAYMENT_STATUS_CHANGED' },
          (payload: any) => {
            const data = payload.payload;
            if (data && data.orderId) {
              setOrders((prev) =>
                prev.map((order) => (order.id === data.orderId ? { ...order, estado_pago: data.newPaymentStatus } : order))
              );
            }
          }
        )
        .subscribe();

      channelRef.current = channel;

      return () => {
        supabase.removeChannel(channel);
        channelRef.current = null;
        if (broadcastRef.current) {
          broadcastRef.current.close();
          broadcastRef.current = null;
        }
      };
    }

    return () => {
      if (broadcastRef.current) {
        broadcastRef.current.close();
        broadcastRef.current = null;
      }
    };
  }, [businessId, soundEnabled]);

  // Agregar pedido localmente y emitir a todas las ventanas
  const addOrderLocal = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    playNotificationSound();
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'NEW_ORDER_CREATED', order: newOrder });
    }
  };

  // Actualizar estado localmente y en Supabase Realtime
  const updateOrderStatusLocal = async (orderId: string, status: OrderStatus) => {
    const timestampKey = `${status}_at`;
    const nowStr = new Date().toISOString();

    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, estado: status, [timestampKey]: nowStr } : order))
    );

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'ORDER_STATUS_CHANGED',
        orderId,
        newStatus: status,
        timestamp: nowStr,
      });
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      try {
        const supabase = createClient();
        const updateData: any = { estado: status };
        updateData[timestampKey] = nowStr;

        const { error } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', orderId);

        if (error) {
          console.error('Error en Supabase orders.update:', error);
          toast.error(`Error en base de datos: ${error.message}`, {
            description: 'Es probable que debas agregar las nuevas columnas a la tabla orders en Supabase.',
          });
        } else {
          // Emitir broadcast Supabase Realtime directamente sobre el canal activo
          if (channelRef.current) {
            await channelRef.current.send({
              type: 'broadcast',
              event: 'ORDER_STATUS_CHANGED',
              payload: { orderId, newStatus: status, timestamp: nowStr },
            });
          }
        }
      } catch (err: any) {
        console.error('Error actualizando estado en Supabase:', err);
        toast.error(`Excepción en base de datos: ${err.message || err}`);
      }
    }
  };

  // Actualizar estado de pago localmente y en Supabase Realtime
  const updatePaymentStatusLocal = async (orderId: string, paymentStatus: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, estado_pago: paymentStatus } : order))
    );

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'ORDER_PAYMENT_STATUS_CHANGED',
        orderId,
        newPaymentStatus: paymentStatus,
      });
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      try {
        const supabase = createClient();
        await supabase
          .from('orders')
          .update({ estado_pago: paymentStatus })
          .eq('id', orderId);

        if (channelRef.current) {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'ORDER_PAYMENT_STATUS_CHANGED',
            payload: { orderId, newPaymentStatus: paymentStatus },
          });
        }
      } catch (err) {
        console.error('Error actualizando estado de pago en Supabase:', err);
      }
    }
  };

  return {
    orders,
    soundEnabled,
    setSoundEnabled,
    addOrderLocal,
    updateOrderStatusLocal,
    updatePaymentStatusLocal,
  };
}
