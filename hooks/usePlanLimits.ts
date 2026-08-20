'use client';

import { useMemo } from 'react';
import { Business } from '@/lib/types/database';

export interface PlanLimits {
  maxProductos: number | null;       // null = sin límite
  maxPedidosMes: number | null;
  puedeAgregarProducto: (currentCount: number) => boolean;
  isDemo: boolean;
  plan: string;
}

export function usePlanLimits(business: Business | null): PlanLimits {
  return useMemo(() => {
    if (!business) {
      return {
        maxProductos: null,
        maxPedidosMes: null,
        puedeAgregarProducto: () => true,
        isDemo: false,
        plan: 'unknown',
      };
    }

    const raw = business as any;
    const maxProductos: number | null = raw.plan_max_productos ?? null;
    const maxPedidosMes: number | null = raw.plan_max_pedidos_mes ?? null;
    const isDemo = business.slug === 'restaurante-demo' || business.plan === 'trial';

    return {
      maxProductos,
      maxPedidosMes,
      puedeAgregarProducto: (currentCount: number) =>
        maxProductos === null || currentCount < maxProductos,
      isDemo,
      plan: business.plan || 'trial',
    };
  }, [business]);
}
