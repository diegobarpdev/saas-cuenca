import React from 'react';
import { cn } from '@/lib/utils/cn';
import { OrderStatus, PaymentStatus } from '@/lib/types/database';

interface OrderBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderBadge({ status, className }: OrderBadgeProps) {
  const configs: Record<OrderStatus, { label: string; bg: string; text: string; dot: string }> = {
    pendiente: {
      label: 'Pendiente',
      bg: 'bg-amber-500/10 border-amber-500/30',
      text: 'text-amber-600 dark:text-amber-400',
      dot: 'bg-amber-500 animate-pulse',
    },
    aceptado: {
      label: 'Aceptado',
      bg: 'bg-blue-500/10 border-blue-500/30',
      text: 'text-blue-600 dark:text-blue-400',
      dot: 'bg-blue-500',
    },
    en_preparacion: {
      label: 'En preparación',
      bg: 'bg-indigo-500/10 border-indigo-500/30',
      text: 'text-indigo-600 dark:text-indigo-400',
      dot: 'bg-indigo-500 animate-ping',
    },
    listo: {
      label: 'Listo / En camino',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      dot: 'bg-emerald-500',
    },
    entregado: {
      label: 'Entregado',
      bg: 'bg-slate-500/10 border-slate-500/30',
      text: 'text-slate-600 dark:text-slate-400',
      dot: 'bg-slate-400',
    },
    cancelado: {
      label: 'Cancelado',
      bg: 'bg-rose-500/10 border-rose-500/30',
      text: 'text-rose-600 dark:text-rose-400',
      dot: 'bg-rose-500',
    },
  };

  const config = configs[status] || configs.pendiente;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm transition-all',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

interface PaymentBadgeProps {
  status: PaymentStatus;
  method?: string;
  className?: string;
}

export function PaymentBadge({ status, method, className }: PaymentBadgeProps) {
  const configs: Record<PaymentStatus, { label: string; bg: string; text: string }> = {
    pendiente: {
      label: 'Pago Pendiente',
      bg: 'bg-amber-500/10 border-amber-500/30',
      text: 'text-amber-600 dark:text-amber-400',
    },
    pagado: {
      label: 'Pagado',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    verificando: {
      label: 'Verificando Comprobante',
      bg: 'bg-sky-500/10 border-sky-500/30',
      text: 'text-sky-600 dark:text-sky-400',
    },
    rechazado: {
      label: 'Pago Rechazado',
      bg: 'bg-rose-500/10 border-rose-500/30',
      text: 'text-rose-600 dark:text-rose-400',
    },
  };

  const config = configs[status] || configs.pendiente;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border',
        config.bg,
        config.text,
        className
      )}
    >
      {method ? `${method.toUpperCase()}: ` : ''}{config.label}
    </span>
  );
}
