'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/lib/types/database';

export interface CustomerProfile {
  nombre: string;
  telefono: string;
  direccion: string;
  requiereFactura: boolean;
  rucCi: string;
  razonSocial: string;
  email: string;
}

const PROFILE_KEY = 'kaltiro_customer_profile';
const ORDERS_KEY = 'kaltiro_customer_orders_ids';

export function useCustomerOrders(businessSlug: string) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Cargar perfil local e IDs de pedidos guardados en este dispositivo
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }

      const savedIds = localStorage.getItem(ORDERS_KEY);
      if (savedIds) {
        setOrderIds(JSON.parse(savedIds));
      }
    } catch (e) {
      console.error('Error leyendo historial local de Kaltiro:', e);
    }
  }, []);

  // 2. Cargar estado en tiempo real de los pedidos del cliente desde Supabase
  useEffect(() => {
    async function fetchOrdersStatus() {
      if (orderIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .in('id', orderIds)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setOrders(data as Order[]);
        }
      } catch (err) {
        console.error('Error cargando pedidos en tiempo real:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrdersStatus();
  }, [orderIds]);

  // 3. Guardar perfil local del cliente para auto-completar en el checkout
  const saveCustomerProfile = (newProfile: CustomerProfile) => {
    try {
      setProfile(newProfile);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
    } catch (e) {
      console.error('Error guardando perfil local de Kaltiro:', e);
    }
  };

  // 4. Agregar nuevo ID de pedido al historial local
  const addOrderIdToHistory = (orderId: string) => {
    try {
      const updatedIds = Array.from(new Set([orderId, ...orderIds]));
      setOrderIds(updatedIds);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedIds));
    } catch (e) {
      console.error('Error guardando pedido en historial local:', e);
    }
  };

  return {
    profile,
    orders,
    loading,
    saveCustomerProfile,
    addOrderIdToHistory,
    activeOrdersCount: orders.filter((o) => o.estado !== 'entregado' && o.estado !== 'cancelado').length,
  };
}
