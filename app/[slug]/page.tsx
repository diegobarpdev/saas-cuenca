'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Search, MapPin, ExternalLink, Truck, Clock, ShieldCheck, PhoneCall, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    async function loadLiveData() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: busData } = await supabase
          .from('businesses')
          .select('*')
          .eq('slug', slug)
          .single();

        if (busData) {
          setBusiness(busData as Business);
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
        console.error('Error cargando datos:', err);
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    }

    loadLiveData();
  }, [slug]);

  if (loading) {
    return <SkeletonCatalog />;
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#080B11] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-display font-black">Local No Encontrado</h1>
        <p className="text-xs text-slate-400 max-w-sm">
          El negocio con el enlace <strong className="text-white">/{slug}</strong> no se encuentra registrado en Piku.ec.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs shadow-lg transition-colors"
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

  const getFontFamilyString = (tipografia?: string) => {
    switch (tipografia) {
      case 'Playfair':
        return "'Playfair Display', Georgia, serif";
      case 'Inter':
        return "'Inter', -apple-system, sans-serif";
      case 'Plus Jakarta Sans':
        return "'Plus Jakarta Sans', sans-serif";
      case 'Outfit':
      default:
        return "'Outfit', sans-serif";
    }
  };

  const activeFontFamily = getFontFamilyString(business.branding?.tipografia);
  const activeBgColor = business.branding?.color_fondo || '#080B11';
  const activeTextColor = business.branding?.color_texto || '#F8FAFC';

  return (
    <div
      className="min-h-screen flex flex-col pb-28 transition-colors duration-300"
      style={{
        fontFamily: activeFontFamily,
        backgroundColor: activeBgColor,
        color: activeTextColor,
      }}
    >
      {/* Header Estilo Apple Store */}
      <HeaderCatalog
        business={business}
        cartCount={totalItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Contenido Principal con Espaciado Generoso (Apple / Airbnb style) */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* Banner Compacto de Marca & Ubicación */}
        <div
          className="relative p-4 md:p-5 rounded-2xl bg-[#0F1420]/80 border border-white/10 shadow-lg overflow-hidden backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={
            business.branding?.banner_url
              ? {
                  backgroundImage: `linear-gradient(to right, rgba(15, 21, 36, 0.92), rgba(11, 15, 27, 0.95)), url(${business.branding.banner_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {(() => {
            const op = business.configuracion_operativa;
            const prepTimeText = op?.tiempo_preparacion || '15 - 25 min';
            const deliveryText =
              op?.permite_domicilio !== false && op?.permite_retiro !== false
                ? 'Domicilio & Retiro'
                : op?.permite_domicilio !== false
                ? 'Solo Domicilio'
                : 'Solo Retiro en Local';

            const paymentList: string[] = [];
            if (op?.acepta_deuna !== false) paymentList.push('Deuna!');
            if (op?.acepta_payphone !== false) paymentList.push('PayPhone');
            if (op?.acepta_transferencia !== false) paymentList.push('Transferencia');
            if (op?.acepta_efectivo !== false) paymentList.push('Efectivo');
            const paymentsText = paymentList.length > 0 ? paymentList.join(' • ') : 'Efectivo • Deuna!';

            return (
              <div className="space-y-1.5 min-w-0">
                <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-tight leading-snug truncate">
                  {business.nombre}
                </h2>
                <p className="text-xs text-slate-300 line-clamp-1 font-normal">
                  {business.branding?.slogan || 'Especialidades preparadas al instante. Pedidos directos a domicilio o retiro.'}
                </p>

                {/* Micro-strip de tiempo, entrega y métodos de pago dinámicos */}
                <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] font-display text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-200 font-medium">{prepTimeText}</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-slate-200 font-medium">{deliveryText}</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                    <span className="text-slate-200 font-medium">{paymentsText}</span>
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.nombre + ' ' + (business.direccion || 'Cuenca Ecuador'))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl text-xs font-display font-bold bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-amber-400 hover:text-amber-300 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 group"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3 text-amber-400 opacity-70 group-hover:opacity-100" />
            </a>

            {business.telefono_whatsapp && (
              <a
                href={`https://wa.me/${business.telefono_whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl text-xs font-display font-bold bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {/* Barra de Filtro de Categorías & Buscador */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Categorías Desplazables (Pills Estilo Arc / Airbnb) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-display font-bold whitespace-nowrap transition-all ${
                  selectedCategory === null
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Menú Completo ({products.length})
              </button>

              {categories.map((cat) => {
                const count = products.filter((p) => p.category_id === cat.id).length;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-display font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat.nombre} ({count})
                  </button>
                );
              })}
            </div>

            {/* Buscador de Productos */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar plato o bebida..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Cuadrícula de Productos Elegante */}
        {filteredProducts.length === 0 ? (
          <div className="p-16 text-center rounded-3xl border border-slate-800 bg-slate-900/30 text-slate-400 font-display text-sm">
            No encontramos platos disponibles en esta sección.
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
      </main>

      {/* Floating Bottom Bar para Móviles (Estilo Apple / Shopify) */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-5 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-display font-black text-sm shadow-2xl shadow-amber-500/30 flex items-center justify-between active:scale-98 transition-all border border-amber-400/40"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-slate-950 text-amber-400 font-mono font-black text-xs flex items-center justify-center shadow-md">
                {totalItemsCount}
              </span>
              <span>Ver Pedido en Piku</span>
            </div>
            <span className="font-mono text-base font-bold">
              {subtotal.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}
            </span>
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
