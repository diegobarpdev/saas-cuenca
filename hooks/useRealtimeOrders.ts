'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order, OrderStatus } from '@/lib/types/database';
import { MOCK_INITIAL_ORDERS } from '@/lib/supabase/mock-data';

export function useRealtimeOrders(businessId: string, initialOrders: Order[] = MOCK_INITIAL_ORDERS) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

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

      const channel = supabase
        .channel(`realtime-orders-${businessId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `business_id=eq.${businessId}`,
          },
          (payload) => {
            const newOrder = payload.new as Order;
            setOrders((prev) => [newOrder, ...prev]);
            playNotificationSound();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `business_id=eq.${businessId}`,
          },
          (payload) => {
            const updatedOrder = payload.new as Order;
            setOrders((prev) =>
              prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
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

  // Actualizar estado localmente y emitir a todas las pestañas abiertas
  const updateOrderStatusLocal = (orderId: string, status: OrderStatus) => {
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
  };

  return {
    orders,
    soundEnabled,
    setSoundEnabled,
    addOrderLocal,
    updateOrderStatusLocal,
  };
}
