'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Search, MapPin, ExternalLink, Truck, Clock, ShieldCheck, PhoneCall, AlertCircle, Flame, ClipboardList, ShoppingBag } from 'lucide-react';
import { FoodPatternBackground } from '@/components/catalog/FoodPatternBackground';
import { ProductCard } from '@/components/catalog/ProductCard';
import { CartDrawer } from '@/components/catalog/CartDrawer';
import { CustomerOrdersDrawer } from '@/components/catalog/CustomerOrdersDrawer';
import { SkeletonCatalog } from '@/components/ui/SkeletonCatalog';
import { useCart } from '@/hooks/useCart';
import { useCustomerOrders } from '@/hooks/useCustomerOrders';
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
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  const { items, addItem, updateQuantity, removeItem, clearCart, totalItemsCount, subtotal } = useCart(slug);
  const { orders: customerOrders, loading: loadingOrders, activeOrdersCount } = useCustomerOrders(slug);

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
          El negocio con el enlace <strong className="text-white">/{slug}</strong> no se encuentra registrado en Yapi.ec.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs shadow-lg transition-colors"
        >
          Volver a Yapi Principal
        </Link>
      </div>
    );
  }

  const promoProductsCount = products.filter((p) => p.en_oferta && p.precio_oferta).length;

  const filteredProducts = products.filter((p) => {
    let matchesCategory = true;
    if (selectedCategory === 'promos') {
      matchesCategory = !!(p.en_oferta && p.precio_oferta);
    } else if (selectedCategory !== null) {
      matchesCategory = p.category_id === selectedCategory;
    }
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
  const activeBgColor = business.branding?.color_fondo || '#07090E';
  const activeTextColor = business.branding?.color_texto || '#F8FAFC';
  const activePrimaryColor = business.branding?.color_primario || '#10B981';
  const activeSecondaryColor = business.branding?.color_secundario || '#F59E0B';

  return (
    <div
      className="min-h-screen flex flex-col pb-28 transition-colors duration-300 relative overflow-hidden bg-[#07090E]"
      style={{
        fontFamily: activeFontFamily,
        backgroundColor: activeBgColor,
        color: activeTextColor,
      }}
    >
      {/* Estampado & Luces Ambientales de Fondo Personalizable */}
      <FoodPatternBackground 
        pattern={business.branding?.patron_fondo} 
        color={activePrimaryColor}
      />

      {/* Contenido Principal con Espaciado Generoso & Riqueza Visual */}
      <main className="max-w-7xl mx-auto px-3 sm:px-8 py-4 sm:py-8 flex-1 w-full space-y-6 sm:space-y-8 relative z-10">
        
        {/* Encabezado Único e Impecable de Marca del Restaurante */}
        <div
          className="relative p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0E1320]/95 via-[#0D121F]/90 to-[#121929]/95 border border-white/15 shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 group"
          style={
            business.branding?.banner_url
              ? {
                  backgroundImage: `linear-gradient(to right, rgba(14, 19, 32, 0.94), rgba(11, 15, 27, 0.97)), url(${business.branding.banner_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {/* Destello de fondo sutil */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-700"></div>

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
            if (op?.acepta_payphone !== false && business.has_payphone) paymentList.push('PayPhone');
            if (op?.acepta_transferencia !== false) paymentList.push('Transferencia');
            if (op?.acepta_efectivo !== false) paymentList.push('Efectivo');
            const paymentsText = paymentList.length > 0 ? paymentList.join(' • ') : 'Efectivo • Deuna!';

            return (
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 relative z-10">
                {/* Logo Destacado del Local */}
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={business.nombre}
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/20 shadow-2xl flex-shrink-0 ring-2 sm:ring-4 ring-black/40"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center font-display font-black text-slate-950 text-2xl sm:text-3xl shadow-2xl flex-shrink-0 border border-amber-400/40">
                    {business.nombre.charAt(0)}
                  </div>
                )}

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-3xl font-display font-black text-white tracking-tight leading-snug truncate">
                      {business.nombre}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Abierto
                    </span>
                  </div>

                  <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-1 font-normal">
                    {business.branding?.slogan || 'Especialidades preparadas al instante. Pedidos directos a domicilio o retiro.'}
                  </p>

                  {/* Micro-strip de tiempo, entrega y métodos de pago dinámicos */}
                  <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-display text-slate-400">
                    <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-full border border-white/10">
                      <Clock className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      <span className="text-slate-200 font-medium">{prepTimeText}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-full border border-white/10">
                      <Truck className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <span className="text-slate-200 font-medium">{deliveryText}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-full border border-white/10">
                      <ShieldCheck className="w-3 h-3 text-sky-400 flex-shrink-0" />
                      <span className="text-slate-200 font-medium">{paymentsText}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Acciones de Navegación del Cliente Adaptadas a Móviles */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 flex-shrink-0 relative z-10 w-full sm:w-auto">
            <button
              onClick={() => setIsOrdersOpen(true)}
              className="px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-white/15 flex items-center justify-center gap-1.5 text-xs font-display font-bold active:scale-95 shadow-md"
            >
              <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
              <span>Mis Pedidos</span>
              {activeOrdersCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-400 text-slate-950 rounded-full">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              style={{ backgroundColor: activePrimaryColor, borderColor: activePrimaryColor, color: '#090D16' }}
              className="px-3 py-2 rounded-2xl font-display font-black text-xs md:text-sm shadow-lg active:scale-95 transition-all border flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              <span>Mi Pedido</span>
              {totalItemsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-slate-950 text-white font-mono font-black text-[10px] flex items-center justify-center">
                  {totalItemsCount}
                </span>
              )}
            </button>

            <a
              href={
                business.google_maps_url ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.nombre + ' ' + (business.direccion || 'Cuenca Ecuador'))}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-2xl text-xs font-display font-bold bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-slate-200 hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 group cursor-pointer"
              title="Ver ubicación en Google Maps"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              <span>Maps</span>
              <ExternalLink className="w-3 h-3 text-slate-400 opacity-70 group-hover:opacity-100" />
            </a>

            {business.telefono_whatsapp && (
              <a
                href={`https://wa.me/${business.telefono_whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-2xl text-xs font-display font-bold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                title="Contactar al local por WhatsApp"
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
            {/* Categorías Desplazables */}
            <div className="flex items-center gap-2 overflow-x-auto py-1.5 px-1 -mx-1 scrollbar-none touch-pan-x">
              <button
                onClick={() => setSelectedCategory(null)}
                style={
                  selectedCategory === null
                    ? { backgroundColor: activePrimaryColor, borderColor: activePrimaryColor, color: '#090D16' }
                    : undefined
                }
                className={`px-4 py-2 rounded-2xl text-xs font-display font-bold whitespace-nowrap transition-all ${
                  selectedCategory === null
                    ? 'font-black border'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800/80'
                }`}
              >
                Menú Completo ({products.length})
              </button>

              {promoProductsCount > 0 && (
                <button
                  onClick={() => setSelectedCategory('promos')}
                  className={`px-4 py-2 rounded-2xl text-xs font-display font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedCategory === 'promos'
                      ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 text-slate-950 font-black border border-rose-400/30'
                      : 'bg-rose-500/10 text-rose-300 hover:text-white border border-rose-500/30'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                  <span>Ofertas & Promos ({promoProductsCount})</span>
                </button>
              )}

              {categories.map((cat) => {
                const count = products.filter((p) => p.category_id === cat.id).length;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={
                      isActive
                        ? { backgroundColor: activePrimaryColor, borderColor: activePrimaryColor, color: '#090D16' }
                        : undefined
                    }
                    className={`px-4 py-2 rounded-2xl text-xs font-display font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? 'font-black border'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800/80'
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

        {/* Cuadrícula de Productos Elegante Agrupada por Categorías */}
        {selectedCategory !== null ? (
          // Vista de una categoría específica o Promociones
          filteredProducts.length === 0 ? (
            <div className="p-16 text-center rounded-3xl border border-slate-800 bg-slate-900/30 text-slate-400 font-display text-sm">
              No encontramos platos disponibles en esta sección.
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-display font-black text-white border-b border-white/10 pb-2.5 flex items-center gap-2">
                {selectedCategory === 'promos' ? (
                  <>
                    <Flame className="w-5 h-5 fill-rose-500 text-rose-500" />
                    <span>Ofertas & Promos Especiales</span>
                  </>
                ) : (
                  <span>{categories.find((c) => c.id === selectedCategory)?.nombre}</span>
                )}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addItem}
                    primaryColor={activePrimaryColor}
                    secondaryColor={activeSecondaryColor}
                  />
                ))}
              </div>
            </div>
          )
        ) : (
          // Vista de Menú Completo: Agrupado por Categorías
          (() => {
            const matchesSearchGlobal = products.filter((p) =>
              p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
            );

            if (matchesSearchGlobal.length === 0) {
              return (
                <div className="p-16 text-center rounded-3xl border border-slate-800 bg-slate-900/30 text-slate-400 font-display text-sm">
                  No encontramos platos que coincidan con tu búsqueda.
                </div>
              );
            }

            return (
              <div className="space-y-12">
                {/* 1. Sección de Ofertas en Menú Completo (Si existen y coinciden con la búsqueda) */}
                {(() => {
                  const matchingPromos = products.filter(
                    (p) =>
                      p.en_oferta &&
                      p.precio_oferta &&
                      (p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase())))
                  );

                  if (matchingPromos.length > 0) {
                    return (
                      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
                        <h2 className="text-xl md:text-2xl font-display font-black text-white border-b border-white/10 pb-2.5 flex items-center gap-2">
                          <Flame className="w-5 h-5 fill-rose-500 text-rose-500" />
                          <span>Ofertas de la Casa</span>
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {matchingPromos.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              onAddToCart={addItem}
                              primaryColor={activePrimaryColor}
                              secondaryColor={activeSecondaryColor}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* 2. Sección para cada Categoría */}
                {categories.map((cat) => {
                  const matchingProducts = products.filter(
                    (p) =>
                      p.category_id === cat.id &&
                      (p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase())))
                  );

                  if (matchingProducts.length === 0) return null;

                  return (
                    <div key={cat.id} className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
                      <h2 className="text-xl md:text-2xl font-display font-black text-white border-b border-white/10 pb-2.5 flex items-center gap-2.5">
                        <span>{cat.nombre}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900/60 px-2.5 py-0.5 rounded-full border border-white/5 shrink-0">
                          {matchingProducts.length} {matchingProducts.length === 1 ? 'plato' : 'platos'}
                        </span>
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matchingProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={addItem}
                            primaryColor={activePrimaryColor}
                            secondaryColor={activeSecondaryColor}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </main>

      {/* Floating Bottom Bar para Móviles */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-5 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            style={{ backgroundColor: activePrimaryColor, borderColor: activePrimaryColor, color: '#090D16' }}
            className="w-full py-4 px-6 rounded-2xl font-display font-black text-sm shadow-2xl flex items-center justify-between active:scale-98 transition-all border cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-slate-950 text-white font-mono font-black text-xs flex items-center justify-center shadow-md">
                {totalItemsCount}
              </span>
              <span>Ver Pedido en Yapi</span>
            </div>
            <span className="font-mono text-base font-bold">
              {subtotal.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}
            </span>
          </button>
        </div>
      )}

      {/* Drawer de Mis Pedidos */}
      <CustomerOrdersDrawer
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        orders={customerOrders}
        loading={loadingOrders}
        businessSlug={slug}
      />

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
        primaryColor={activePrimaryColor}
      />
    </div>
  );
}
