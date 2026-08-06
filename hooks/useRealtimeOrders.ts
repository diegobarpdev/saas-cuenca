'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order, OrderStatus } from '@/lib/types/database';
import { MOCK_INITIAL_ORDERS } from '@/lib/supabase/mock-data';

export function useRealtimeOrders(businessId: string, initialOrders: Order[] = []) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const channelRef = useRef<any>(null);

  // Inicializar audio de notificación y BroadcastChannel para comunicación entre pestañas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      
      // BroadcastChannel para sincronizar ventanas locales al instante
      if ('BroadcastChannel' in window) {
        broadcastRef.current = new BroadcastChannel('saas-cuenca-orders-channel');
        
        broadcastRef.current.onmessage = (event) => {
          if (event.data?.type === 'ORDER_STATUS_CHANGED') {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === event.data.orderId ? { ...order, estado: event.data.newStatus } : order
              )
            );
          } else if (event.data?.type === 'NEW_ORDER_CREATED') {
            setOrders((prev) => [event.data.order, ...prev]);
            playNotificationSound();
          }
        };
      }
    }

    return () => {
      if (broadcastRef.current) {
        broadcastRef.current.close();
      }
    };
  }, []);

  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch((e) => console.log('Audio bloqueado:', e));
    }
  };

  useEffect(() => {
    if (!businessId) return;

    // Si hay cliente Supabase real en producción
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      const supabase = createClient();

      const fetchOrders = async () => {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setOrders(data as Order[]);
        }
      };

      fetchOrders();

      const channelName = `piku-orders-${businessId}`;
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
          },
          (payload: any) => {
            const newOrder = payload.new as Order;
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
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
          },
          (payload: any) => {
            const updatedOrder = payload.new as Order;
            if (!updatedOrder) return;
            setOrders((prev) =>
              prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
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
              setOrders((prev) =>
                prev.map((order) => (order.id === data.orderId ? { ...order, estado: data.newStatus } : order))
              );
            }
          }
        )
        .subscribe();

      channelRef.current = channel;

      return () => {
        supabase.removeChannel(channel);
        channelRef.current = null;
      };
    }
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
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, estado: status } : order))
    );

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'ORDER_STATUS_CHANGED',
        orderId,
        newStatus: status,
      });
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      try {
        const supabase = createClient();
        await supabase
          .from('orders')
          .update({ estado: status })
          .eq('id', orderId);

        // Emitir broadcast Supabase Realtime directamente sobre el canal activo
        if (channelRef.current) {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'ORDER_STATUS_CHANGED',
            payload: { orderId, newStatus: status },
          });
        }
      } catch (err) {
        console.error('Error actualizando estado en Supabase:', err);
      }
    }
  };

  return {
    orders,
    soundEnabled,
    setSoundEnabled,
    addOrderLocal,
    updateOrderStatusLocal,
  };
}
