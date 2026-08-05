'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Clock, Truck, ShieldCheck, PhoneCall, UtensilsCrossed, Star, MapPin, Store, AlertCircle } from 'lucide-react';
import { HeaderCatalog } from '@/components/catalog/HeaderCatalog';
import { ProductCard } from '@/components/catalog/ProductCard';
import { CartDrawer } from '@/components/catalog/CartDrawer';
import { SkeletonCatalog } from '@/components/ui/SkeletonCatalog';
import { useCart } from '@/hooks/useCart';
import { createClient } from '@/lib/supabase/client';
import { Business, Category, Product } from '@/lib/types/database';

export default function PublicCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { items, addItem, updateQuantity, removeItem, clearCart, totalItemsCount, subtotal } = useCart(slug);

  // Cargar datos REALES únicamente desde Supabase Postgres
  useEffect(() => {
    async function loadLiveData() {
      setLoading(true);
      try {
        const supabase = createClient();

        // 1. Consultar negocio por slug
        const { data: busData, error: busError } = await supabase
          .from('businesses')
          .select('*')
          .eq('slug', slug)
          .single();

        if (busData) {
          setBusiness(busData as Business);

          // 2. Obtener categorías y productos del negocio
          const [catRes, prodRes] = await Promise.all([
            supabase.from('categories').select('*').eq('business_id', busData.id).order('orden'),
            supabase.from('products').select('*').eq('business_id', busData.id).eq('disponible', true),
          ]);

          if (catRes.data) setCategories(catRes.data as Category[]);
          if (prodRes.data) setProducts(prodRes.data as Product[]);
        } else {
          setBusiness(null);
        }
      } catch (err) {
        console.error('Error cargando datos de Supabase:', err);
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    }

    loadLiveData();
  }, [slug]);

  // Mostrar esqueleto de carga resplandeciente mientras obtiene la data real de Supabase
  if (loading) {
    return <SkeletonCatalog />;
  }

  // Si el local no existe en la base de datos de Supabase
  if (!business) {
    return (
      <div className="min-h-screen bg-[#090C15] text-white flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-display font-black">Local No Encontrado</h1>
        <p className="text-xs text-slate-400 max-w-sm">
          El negocio con el enlace <strong className="text-white">/{slug}</strong> no está registrado o no se encuentra activo en Piku.ec.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs shadow-lg transition-colors"
        >
          Volver a Piku Principal
        </Link>
      </div>
    );
  }

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#090C15] text-slate-100 flex flex-col font-sans pb-28 relative overflow-hidden w-full">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] glow-ambient-gold pointer-events-none"></div>
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] glow-ambient-terracotta pointer-events-none"></div>

      {/* Header */}
      <HeaderCatalog
        business={business}
        cartCount={totalItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Layout Principal con Sidebar Lateral en Escritorio */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 flex-1 w-full relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: Navegación & Filtros (Sticky en Desktop) */}
          <aside className="w-full lg:w-72 space-y-6 lg:sticky lg:top-24 flex-shrink-0">
            {/* Tarjeta de Información del Negocio */}
            <div className="luxe-card p-6 rounded-3xl space-y-4">
              <div className="space-y-1">
                <span className="badge-emerald inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono-tech font-bold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Local Abierto
                </span>
                <h2 className="font-display font-black text-xl text-white tracking-tight leading-snug">
                  {business.nombre}
                </h2>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Gastronomía & Productos Artesanales en Cuenca.
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500 font-mono-tech">Valoración</span>
                  <span className="font-mono-tech font-bold text-amber-400 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> 4.9 (120+)
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500 font-mono-tech">Preparación</span>
                  <span className="font-mono-tech font-bold text-slate-200">15-25 min</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500 font-mono-tech">Entrega</span>
                  <span className="font-mono-tech font-bold text-emerald-400">Cuenca Urbana</span>
                </div>
              </div>

              {business.telefono_whatsapp && (
                <a
                  href={`https://wa.me/${business.telefono_whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 text-xs font-display font-extrabold flex items-center justify-center gap-2 border border-emerald-500/30 transition-all shadow-md active:scale-95"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Contactar por WhatsApp</span>
                </a>
              )}
            </div>

            {/* Buscador de Productos */}
            <div className="relative">
              <Search className="w-4 h-4 text-amber-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Buscar en el catálogo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
              />
            </div>

            {/* Categorías Lateral (Desktop) */}
            <div className="hidden lg:block luxe-card p-4 rounded-3xl space-y-2">
              <h3 className="font-display font-black text-xs text-amber-400 uppercase tracking-wider px-3 pb-1">
                Menú & Secciones
              </h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-display font-bold transition-all ${
                    selectedCategory === null
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <span>Todos los productos</span>
                  <span className="font-mono-tech text-[10px] opacity-80">{products.length}</span>
                </button>

                {categories.map((cat) => {
                  const count = products.filter((p) => p.category_id === cat.id).length;
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-display font-bold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                      }`}
                    >
                      <span className="truncate pr-2">{cat.nombre}</span>
                      <span className="font-mono-tech text-[10px] opacity-80 flex-shrink-0">{count}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* COLUMNA DERECHA: Catálogo & Cuadrícula de Productos */}
          <div className="flex-1 w-full space-y-6">
            
            {/* Categorías Desplazables (Móvil / Tablet) */}
            <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-display font-black whitespace-nowrap transition-all ${
                  selectedCategory === null
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Todos ({products.length})
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.category_id === cat.id).length;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-display font-black whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat.nombre} ({count})
                  </button>
                );
              })}
            </div>

            {/* Banner Editorial Hero */}
            <div className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900/90 to-orange-950/50 border border-amber-500/20 shadow-2xl overflow-hidden backdrop-blur-md">
              <div className="relative z-10 space-y-2 max-w-xl">
                <span className="badge-gold inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-tech font-bold">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" /> Carta Oficial de {business.nombre}
                </span>
                <h3 className="text-2xl md:text-3xl font-display font-black text-white leading-tight">
                  Selección Directa de la Tienda 🚀
                </h3>
                <p className="text-xs md:text-sm text-slate-300 font-normal leading-relaxed">
                  Catálogo sincronizado en tiempo real con Supabase. Haz tu pedido y paga con PayPhone, Deuna o Efectivo.
                </p>
              </div>
            </div>

            {/* Grid de Productos (3 Columnas Espaciosas) */}
            {filteredProducts.length === 0 ? (
              <div className="p-16 text-center luxe-card rounded-3xl border border-slate-800 text-slate-500">
                <p className="font-display font-bold text-sm text-slate-300">No encontramos productos disponibles en esta sección.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addItem}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Floating Mobile Bottom Bar */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-5 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-display font-black text-sm shadow-2xl shadow-amber-500/35 flex items-center justify-between active:scale-98 transition-all border border-amber-400/40"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-slate-950 text-amber-400 font-mono-tech font-black text-xs flex items-center justify-center shadow-md">
                {totalItemsCount}
              </span>
              <span>Ver Pedido en Piku</span>
            </div>
            <span className="font-mono-tech text-base">{subtotal.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        subtotal={subtotal}
        businessSlug={slug}
      />
    </div>
  );
}
