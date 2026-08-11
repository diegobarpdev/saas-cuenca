'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Wifi,
  BatteryFull,
  SignalHigh,
  MapPin,
  Plus,
  Minus,
  ChevronRight,
  Leaf,
  X,
} from 'lucide-react';

const MENU_CATEGORIES = ['Entradas', 'Platos Fuertes', 'Carnes', 'Bebidas', 'Postres'] as const;

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: (typeof MENU_CATEGORIES)[number];
  image: string;
};

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'llapingachos',
    name: 'Llapingachos',
    price: 6.5,
    category: 'Entradas',
    image: 'https://images.unsplash.com/photo-1713449236354-848bff0288bf?w=300&h=200&fit=crop&q=80',
  },
  {
    id: 'empanadas',
    name: 'Empanadas de Verde',
    price: 4,
    category: 'Entradas',
    image: 'https://images.unsplash.com/photo-1605613160690-4606345d5d39?w=300&h=200&fit=crop&q=80',
  },
  {
    id: 'ceviche',
    name: 'Ceviche de Camarón',
    price: 9,
    category: 'Entradas',
    image: 'https://images.unsplash.com/photo-1626663011352-cacdcfe333f8?w=300&h=200&fit=crop&q=80',
  },
  {
    id: 'seco-pollo',
    name: 'Seco de Pollo',
    price: 8,
    category: 'Platos Fuertes',
    image: 'https://images.unsplash.com/photo-1710256198508-41630f431e35?w=300&h=200&fit=crop&q=80',
  },
  {
    id: 'tallarin',
    name: 'Tallarín Saltado',
    price: 7.5,
    category: 'Platos Fuertes',
    image: 'https://images.unsplash.com/photo-1615750856719-9b7f225e9273?w=300&h=200&fit=crop&q=80',
  },
  {
    id: 'pescado',
    name: 'Pescado a la Plancha',
    price: 10,
    category: 'Platos Fuertes',
    image: 'https://images.unsplash.com/photo-1665401015549-712c0dc5ef85?w=300&h=200&fit=crop&q=80',
  },
  {
    id: 'lomo',
    name: 'Lomo a la Plancha',
    price: 9.5,
    category: 'Carnes',
    image: 'https://images.unsplash.com/photo-1579366948929-444eb79881eb?w=300&h=200&fit=crop&q=80',
  },
  {
    id: 'churrasco',
    name: 'Churrasco Mixto',
    price: 11,
    category: 'Carnes',
    image: 'https://images.unsplash.com/photo-1775481391371-fab83ed296e9?w=300&h=200&fit=crop&q=80',
  },
  {
    id: 'alitas',
    name: 'Alitas BBQ',
    price: 8.5,
    category: 'Carnes',
    image: 'https://images.unsplash.com/photo-1600555379765-f82335a7b1b0?w=300&h=200&fit=crop&q=80',
  },
  {
    id: 'jugo',
    name: 'Jugo de Naranja',
    price: 2.5,
    category: 'Bebidas',
    image: 'https://images.unsplash.com/photo-1577680716097-9a565ddc2007?w=300&h=200&fit=crop&q=80',
  },
  {
    id: 'cafe-helado',
    name: 'Café Helado',
    price: 3,
    category: 'Bebidas',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop&q=80',
  },
  {
    id: 'torta',
    name: 'Torta de Chocolate',
    price: 3.5,
    category: 'Postres',
    image: 'https://images.unsplash.com/photo-1603194202969-12a5dbd29d34?w=300&h=200&fit=crop&q=80',
  },
  {
    id: 'flan',
    name: 'Flan de Caramelo',
    price: 3,
    category: 'Postres',
    image: 'https://images.unsplash.com/photo-1653988354010-39637252a2db?w=300&h=200&fit=crop&q=80',
  },
];

export default function CatalogMockup() {
  const [activeCategory, setActiveCategory] = useState<(typeof MENU_CATEGORIES)[number]>('Entradas');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);

  const items = useMemo(
    () => MENU_ITEMS.filter((item) => item.category === activeCategory),
    [activeCategory],
  );

  const cartEntries = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({ item: MENU_ITEMS.find((m) => m.id === id)!, qty })),
    [cart],
  );

  const totalQty = cartEntries.reduce((sum, { qty }) => sum + qty, 0);
  const totalPrice = cartEntries.reduce((sum, { item, qty }) => sum + item.price * qty, 0);

  function addItem(id: string) {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  function removeItem(id: string) {
    setCart((prev) => {
      const next = { ...prev, [id]: Math.max(0, (prev[id] ?? 0) - 1) };
      return next;
    });
  }

  return (
    <div className="relative w-full max-w-[360px] lg:max-w-[420px]">
      {/* Glow detrás — separa el teléfono del fondo negro del hero */}
      <div className="absolute -inset-8 bg-emerald-500/20 blur-[80px] rounded-full -z-10" />

      {/* Phone bezel */}
      <div className="relative rounded-[2.75rem] bg-[#1a1d24] border-[6px] border-[#2a2e37] shadow-2xl shadow-black/60 ring-1 ring-white/10 overflow-hidden select-none">
        {/* Screen */}
        <div className="relative bg-[#0B0F14] aspect-[9/14.5] flex flex-col">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-30" />

          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1 text-white shrink-0">
            <span className="text-xs font-mono-tech font-semibold">9:41</span>
            <div className="flex items-center gap-1.5">
              <SignalHigh className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <BatteryFull className="w-4 h-4" />
            </div>
          </div>

          {/* Restaurant header */}
          <div className="flex items-center justify-between px-5 pt-3 shrink-0">
            <div>
              <p className="text-white font-display font-black text-lg leading-none">Yapi Restaurant</p>
              <p className="flex items-center gap-1 text-slate-500 text-[11px] mt-1.5">
                <MapPin className="w-3 h-3" />
                Cuenca, EC
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Category pills — click to filter */}
          <div className="flex items-center gap-2 px-5 pt-4 shrink-0 overflow-x-auto no-scrollbar">
            {MENU_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`text-[11px] font-mono-tech font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                  cat === activeCategory
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-white/[0.06] text-slate-400 hover:bg-white/[0.1]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu grid */}
          <div className="grid grid-cols-2 gap-2.5 px-5 pt-4 flex-1 content-start">
            {items.map((item) => {
              const qty = cart[item.id] ?? 0;
              return (
                <div key={item.id} className="rounded-2xl bg-white/[0.04] overflow-hidden flex flex-col">
                  <div className="relative h-20 shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="180px"
                      loading="eager"
                      className="object-cover"
                    />
                  </div>
                  <div className="px-2.5 py-2 flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-white text-[11px] font-bold truncate leading-tight">{item.name}</p>
                      <p className="text-emerald-400 text-[11px] font-mono-tech font-bold">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => addItem(item.id)}
                        aria-label={`Agregar ${item.name}`}
                        className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 cursor-pointer active:scale-90 transition-transform"
                      >
                        <Plus className="w-3 h-3 text-slate-950" strokeWidth={3} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Quitar ${item.name}`}
                          className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                        >
                          <Minus className="w-3 h-3 text-white" strokeWidth={3} />
                        </button>
                        <span className="text-white text-[11px] font-bold w-3 text-center">{qty}</span>
                        <button
                          type="button"
                          onClick={() => addItem(item.id)}
                          aria-label={`Agregar ${item.name}`}
                          className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                        >
                          <Plus className="w-3 h-3 text-slate-950" strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order bar — click to open cart */}
          {totalQty > 0 && (
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="mx-5 mb-5 mt-auto rounded-2xl bg-emerald-500 px-4 py-3 flex items-center justify-between shrink-0 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <span className="text-slate-950 text-[11px] font-bold">
                {totalQty} producto{totalQty > 1 ? 's' : ''} · ${totalPrice.toFixed(2)}
              </span>
              <span className="flex items-center gap-0.5 text-slate-950 text-[11px] font-black">
                Ver Pedido
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
              </span>
            </button>
          )}
          {totalQty === 0 && (
            <div className="mx-5 mb-5 mt-auto shrink-0 text-center text-slate-600 text-[11px] py-3">
              Toca + para armar tu pedido
            </div>
          )}

          {/* Cart overlay */}
          {cartOpen && (
            <div className="absolute inset-0 z-40 bg-[#0B0F14] flex flex-col">
              <div className="flex items-center justify-between px-5 pt-9 pb-3 shrink-0">
                <p className="text-white font-display font-black text-base">Tu pedido</p>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  aria-label="Cerrar pedido"
                  className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 space-y-3">
                {cartEntries.length === 0 && (
                  <p className="text-slate-500 text-xs pt-8 text-center">Tu carrito está vacío.</p>
                )}
                {cartEntries.map(({ item, qty }) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                      <Image src={item.image} alt={item.name} fill sizes="48px" loading="eager" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-xs font-bold truncate">{item.name}</p>
                      <p className="text-emerald-400 text-[11px] font-mono-tech">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Quitar ${item.name}`}
                        className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3 h-3 text-white" strokeWidth={3} />
                      </button>
                      <span className="text-white text-[11px] font-bold w-3 text-center">{qty}</span>
                      <button
                        type="button"
                        onClick={() => addItem(item.id)}
                        aria-label={`Agregar ${item.name}`}
                        className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-slate-950" strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5 shrink-0">
                <div className="rounded-2xl bg-emerald-500 px-4 py-3 flex items-center justify-between">
                  <span className="text-slate-950 text-[11px] font-bold">Total · ${totalPrice.toFixed(2)}</span>
                  <span className="text-slate-950 text-[11px] font-black">Enviar por WhatsApp</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
