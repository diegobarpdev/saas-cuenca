'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CreditCard, Monitor, Printer, BarChart3, Receipt } from 'lucide-react';

const ADDONS = [
  {
    icon: CreditCard,
    name: 'Cobros con tarjeta',
    desc: 'Visa / Mastercard / débito via PayPhone',
    price: '+$9/mes',
  },
  {
    icon: Monitor,
    name: 'Pantalla de cocina',
    desc: 'Vista en vivo de pedidos activos con alertas',
    price: '+$7/mes',
  },
  {
    icon: Printer,
    name: 'Impresión de comandas',
    desc: 'Compatible con ticketeras térmicas 58mm / 80mm',
    price: '+$7/mes',
  },
  {
    icon: BarChart3,
    name: 'Historial y reportes',
    desc: 'Exporta ventas, analiza tus productos top',
    price: '+$5/mes',
  },
  {
    icon: Receipt,
    name: 'Facturación SRI',
    desc: 'Emite facturas electrónicas autorizadas al SRI',
    price: '+$12/mes',
  },
];

export function AddonsCarousel() {
  const addons = ADDONS;
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const CARD_W = 220; // px — ancho aprox de cada card + gap

  const checkScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scrollBy = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * CARD_W, behavior: 'smooth' });
  };

  // Auto-scroll
  useEffect(() => {
    const start = () => {
      autoRef.current = setInterval(() => {
        const el = trackRef.current;
        if (!el) return;
        const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
        el.scrollBy({ left: atEnd ? -(el.scrollWidth) : CARD_W, behavior: 'smooth' });
      }, 3000);
    };
    start();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, []);

  const pause = () => { if (autoRef.current) clearInterval(autoRef.current); };
  const resume = () => {
    pause();
    autoRef.current = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
      el.scrollBy({ left: atEnd ? -(el.scrollWidth) : CARD_W, behavior: 'smooth' });
    }, 3000);
  };

  return (
    <div className="relative" onMouseEnter={pause} onMouseLeave={resume}>
      {/* Left fade + arrow */}
      {canScrollLeft && (
        <>
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10"
            style={{ background: 'linear-gradient(to right, #0A0D15, transparent)' }} />
          <button
            onClick={() => scrollBy(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
        </>
      )}

      {/* Right fade + arrow */}
      {canScrollRight && (
        <>
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10"
            style={{ background: 'linear-gradient(to left, #0A0D15, transparent)' }} />
          <button
            onClick={() => scrollBy(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </>
      )}

      {/* Track */}
      <div
        ref={trackRef}
        onScroll={checkScroll}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2 px-6"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {addons.map((addon) => {
          const Icon = addon.icon;
          return (
            <div
              key={addon.name}
              className="flex-none w-[200px] p-4 rounded-2xl border border-white/[0.07] bg-[#0D1117] hover:border-brand-500/30 hover:bg-[#0F1220] transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-3 group-hover:bg-brand-500/15 transition-colors">
                <Icon className="w-4 h-4 text-brand-400" size={16} />
              </div>
              <p className="text-sm text-white font-display font-bold leading-snug mb-1">
                {addon.name}
              </p>
              <p className="text-[11px] text-slate-500 leading-snug mb-3">
                {addon.desc}
              </p>
              <span className="inline-block px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[11px] font-mono-tech font-bold">
                {addon.price}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
