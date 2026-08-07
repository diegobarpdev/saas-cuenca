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
      aria-instant="true"
    >
      {toasts.map((t) => {
        // Asignación de icono y color de acento
        let Icon = Info;
        let iconColor = 'text-sky-400';
        let borderColor = 'border-sky-500/20';
        let bgGlow = 'bg-sky-500/5';
        
        if (t.type === 'success') {
          Icon = CheckCircle2;
          iconColor = 'text-emerald-400';
          borderColor = 'border-emerald-500/20';
          bgGlow = 'bg-emerald-500/5';
        } else if (t.type === 'error') {
          Icon = XCircle;
          iconColor = 'text-rose-400';
          borderColor = 'border-rose-500/20';
          bgGlow = 'bg-rose-500/5';
        } else if (t.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
          borderColor = 'border-amber-500/20';
          bgGlow = 'bg-amber-500/5';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto w-full p-3.5 sm:p-4 rounded-2xl bg-[#121826] border ${borderColor} ${bgGlow} shadow-2xl flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-top-4 fade-in duration-200`}
          >
            {/* Icono de Estado */}
            <div className="shrink-0 mt-0.5">
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>

            {/* Mensaje e Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-extrabold text-xs sm:text-sm text-white leading-tight">
                {t.message}
              </h4>
              {t.description && (
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
                  {t.description}
                </p>
              )}
            </div>

            {/* Botón Cerrar */}
            <button
              onClick={() => toastStore.dismiss(t.id)}
              className="shrink-0 p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
