'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { toastStore, ToastItem } from '@/lib/utils/toast';

export function CustomToaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    // Suscribirse a los cambios del store de toasts
    const unsubscribe = toastStore.subscribe((newToasts) => {
      setToasts(newToasts);
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2.5 max-w-sm w-auto sm:w-[350px] pointer-events-none"
      aria-live="assertive"
      aria-atomic="true"
    >
      {toasts.map((t) => {
        // Asignación de icono, borde de alta visibilidad y barra de acento
        let Icon = Info;
        let iconColor = 'text-cyan-400';
        let borderColor = 'border-cyan-500/50 hover:border-cyan-500/80';
        let accentBarColor = 'bg-cyan-500';
        let shadowGlow = 'shadow-cyan-500/10';

        if (t.type === 'success') {
          Icon = CheckCircle2;
          iconColor = 'text-brand-400';
          borderColor = 'border-brand-500/50 hover:border-brand-500/80';
          accentBarColor = 'bg-brand-500';
          shadowGlow = 'shadow-brand-500/10';
        } else if (t.type === 'error') {
          Icon = XCircle;
          iconColor = 'text-rose-400';
          borderColor = 'border-rose-500/50 hover:border-rose-500/80';
          accentBarColor = 'bg-rose-500';
          shadowGlow = 'shadow-rose-500/10';
        } else if (t.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
          borderColor = 'border-amber-500/50 hover:border-amber-500/80';
          accentBarColor = 'bg-amber-500';
          shadowGlow = 'shadow-amber-500/10';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto relative w-full p-4 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border ${borderColor} shadow-2xl ${shadowGlow} flex items-start gap-3.5 transition-all duration-300 animate-in slide-in-from-top-4 fade-in overflow-hidden`}
          >
            {/* Barra lateral de acento de color de estado */}
            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${accentBarColor}`}></div>

            {/* Icono de Estado */}
            <div className="shrink-0 mt-0.5 ml-1">
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>

            {/* Mensaje e Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-black text-xs sm:text-sm text-slate-100 leading-snug">
                {t.message}
              </h4>
              {t.description && (
                <p className="text-[11px] sm:text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                  {t.description}
                </p>
              )}
            </div>

            {/* Botón Cerrar */}
            <button
              onClick={() => toastStore.dismiss(t.id)}
              className="shrink-0 p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
