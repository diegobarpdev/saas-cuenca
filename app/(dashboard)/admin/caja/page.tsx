'use client';

import React, { useState, useEffect } from 'react';
import { 
  Store, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Search, 
  Trash2, 
  User, 
  Phone, 
  Receipt, 
  AlertCircle,
  Clock,
  ArrowLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { Product, Category, Order, CartItem } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/currency';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function CajaPOSPage() {
  const { business, loading: loadingBusiness } = useAdminBusiness();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros y búsqueda
  const [activeCategory, setActiveCategory] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Estado del Carrito POS
  const [cart, setCart] = useState<CartItem[]>([]);

  // Datos del Cliente y Pago
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState<'domicilio' | 'retiro_local' | 'mesa'>('mesa');
  const [numeroMesa, setNumeroMesa] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'payphone'>('efectivo');
  const [estadoPago, setEstadoPago] = useState<'pendiente' | 'pagado'>('pagado');

  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error al activar pantalla completa: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Cargar categorías y productos de la base de datos
  const loadData = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').eq('business_id', business.id).order('orden', { ascending: true }),
        supabase.from('products').select('*').eq('business_id', business.id).eq('disponible', true).order('nombre', { ascending: true }),
      ]);

      if (catRes.data) setCategories(catRes.data as Category[]);
      if (prodRes.data) setProducts(prodRes.data as Product[]);
    } catch (err) {
      console.error('Error cargando catálogo POS:', err);
      toast.error('Error al cargar catálogo de productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business]);

  // Agregar producto al carrito
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { product, cantidad: 1, notas: '' }];
    });
  };

  // Decrementar o remover cantidad
  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (existing && existing.cantidad > 1) {
        return prev.map((item) =>
          item.product.id === productId ? { ...item, cantidad: item.cantidad - 1 } : item
        );
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  };

  // Actualizar notas del ítem
  const updateItemNotes = (productId: string, notas: string) => {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, notas } : item))
    );
  };

  // Limpiar Carrito
  const clearCart = () => {
    setCart([]);
    setClienteNombre('Consumidor Final');
    setClienteTelefono('');
    setNumeroMesa('');
    setTipoEntrega('mesa');
    setMetodoPago('efectivo');
    setEstadoPago('pagado');
  };

  // Cálculo de totales
  const getSubtotal = () => {
    return cart.reduce((acc, item) => {
      const price = item.product.en_oferta && item.product.precio_oferta ? item.product.precio_oferta : item.product.precio;
      return acc + price * item.cantidad;
    }, 0);
  };

  const getCostoEnvio = () => {
    return tipoEntrega === 'domicilio' ? 1.50 : 0.00;
  };

  const getTotal = () => {
    return getSubtotal() + getCostoEnvio();
  };

  // Crear Pedido en Caja
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    if (cart.length === 0) {
      toast.error('El carrito de compras está vacío.');
      return;
    }
    if (tipoEntrega === 'mesa' && !numeroMesa) {
      toast.error('Por favor ingresa el número de mesa.');
      return;
    }

    setIsSaving(true);
    const subtotal = getSubtotal();
    const costoEnvio = getCostoEnvio();
    const total = getTotal();

    // 1. Generar número de pedido aleatorio como fallback si falla la secuencia
    const randomOrderNumber = Math.floor(Math.random() * 9000) + 1000;

    const newOrderData = {
      business_id: business.id,
      numero_pedido: randomOrderNumber, // El trigger de BD lo reemplazará por la secuencia correcta
      cliente_nombre: clienteNombre.trim() || 'Consumidor Final',
      cliente_telefono: clienteTelefono.trim() || '0999999999',
      cliente_direccion: tipoEntrega === 'domicilio' ? 'Cuenca, Entrega Local (Caja)' : null,
      tipo_entrega: tipoEntrega,
      numero_mesa: tipoEntrega === 'mesa' ? numeroMesa : null,
      costo_envio: costoEnvio,
      subtotal: subtotal,
      total: total,
      metodo_pago: metodoPago,
      estado_pago: estadoPago,
      estado: 'pendiente'
    };

    try {
      const supabase = createClient();
      
      // 1. Insertar el Pedido principal
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(newOrderData)
        .select()
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('No se recibió la orden creada.');

      // 2. Insertar los ítems del pedido
      const orderItems = cart.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        cantidad: item.cantidad,
        precio_unitario: item.product.en_oferta && item.product.precio_oferta ? item.product.precio_oferta : item.product.precio,
        notas: item.notas || null,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // 3. Emitir notificaciones de WebSockets / Realtime local
      // Canal local BroadcastChannel
      if ('BroadcastChannel' in window) {
        const localChannel = new BroadcastChannel('saas-cuenca-orders-channel');
        localChannel.postMessage({
          type: 'NEW_ORDER_CREATED',
          order: {
            ...orderData,
            items: orderItems.map((item, idx) => ({
              ...item,
              product: cart[idx].product
            }))
          }
        });
        localChannel.close();
      }

      // Canal Supabase Realtime Broadcast
      const channelName = `yapi-orders-${business.id}`;
      const rtChannel = supabase.channel(channelName);
      await rtChannel.send({
        type: 'broadcast',
        event: 'NEW_ORDER',
        payload: {
          ...orderData,
          items: orderItems.map((item, idx) => ({
            ...item,
            product: cart[idx].product
          }))
        }
      });

      toast.success(`Pedido #${String(orderData.numero_pedido).padStart(4, '0')} registrado correctamente.`);
      clearCart();
    } catch (err: any) {
      console.error('Error creando pedido POS:', err);
      toast.error(`Error al registrar pedido: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrar productos
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'todas' || p.category_id === activeCategory;
    const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loadingBusiness || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Store className="w-8 h-8 text-emerald-400 animate-pulse" />
        <p className="text-slate-400 text-xs font-medium">Cargando catálogo de Caja POS...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#070A11] text-slate-100 overflow-hidden w-full select-none">
      
      {/* Header de Caja POS */}
      <header className="h-16 border-b border-white/10 bg-[#0B0F1B] px-6 flex items-center justify-between shrink-0 z-10 w-full">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Volver al panel"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-400" />
            <h1 className="font-display font-black text-sm md:text-base tracking-tight text-white">
              Caja & Facturación Manual (POS)
            </h1>
            <span className="hidden sm:inline-block text-[10px] font-mono-tech font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
              {business?.nombre}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Pantalla completa */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Pantalla Normal</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Pantalla Completa</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col xl:flex-row gap-6 p-6 overflow-hidden min-h-0 w-full">
        
        {/* SECCIÓN IZQUIERDA: Búsqueda, Categorías y Catálogo */}
        <div className="flex-1 flex flex-col space-y-4 min-w-0">
          
          {/* Barra de Búsqueda y Filtros */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#0B0F1B] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

        {/* Categorías Scroller Horizontal */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveCategory('todas')}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === 'todas'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-display font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                  : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* Catálogo de Productos */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-500 border border-dashed border-white/10 rounded-2xl">
              <AlertCircle className="w-7 h-7 mb-2 text-slate-600" />
              <p className="text-xs">No se encontraron productos disponibles.</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const displayPrice = p.en_oferta && p.precio_oferta ? p.precio_oferta : p.precio;
              return (
                <div 
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="bg-[#0B0F1B] border border-white/5 hover:border-emerald-500/40 rounded-2xl p-3 flex flex-col justify-between space-y-3 cursor-pointer group active:scale-95 transition-all shadow-md relative overflow-hidden"
                >
                  {/* Foto o fallback */}
                  <div className="w-full aspect-square rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden relative border border-white/5">
                    {p.imagen_url ? (
                      <img 
                        src={p.imagen_url} 
                        alt={p.nombre} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Store className="w-7 h-7 text-slate-700" />
                    )}

                    {p.en_oferta && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                        PROMO
                      </div>
                    )}
                  </div>

                  {/* Detalles */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-display font-extrabold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                      {p.nombre}
                    </h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1 leading-tight">
                      {p.descripcion || 'Sin descripción.'}
                    </p>
                  </div>

                  {/* Precio & Acción */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-mono-tech font-extrabold text-emerald-400">
                      {formatCurrency(displayPrice)}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(p);
                      }}
                      className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECCIÓN DERECHA: Resumen de Cuenta & Formulario */}
      <div className="w-full xl:w-[400px] bg-[#0B0F1B] border border-white/10 rounded-3xl p-5 flex flex-col h-full shadow-2xl shrink-0">
        
        {/* Ticket Header */}
        <div className="border-b border-white/10 pb-4 flex items-center justify-between">
          <h3 className="font-display font-black text-sm text-white flex items-center gap-2">
            <ShoppingCart className="w-4.5 h-4.5 text-emerald-400" />
            <span>Resumen del Pedido</span>
          </h3>
          <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-white/5 text-slate-400">
            {cart.reduce((acc, item) => acc + item.cantidad, 0)} ítems
          </span>
        </div>

        {/* Lista del Carrito */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3.5 scrollbar-thin">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 text-center">
              <ShoppingCart className="w-8 h-8 mb-2 text-slate-700 animate-bounce" />
              <p className="text-xs">Selecciona productos a la izquierda para armar la comanda.</p>
            </div>
          ) : (
            cart.map((item) => {
              const price = item.product.en_oferta && item.product.precio_oferta ? item.product.precio_oferta : item.product.precio;
              return (
                <div key={item.product.id} className="p-3 bg-slate-950/70 border border-white/5 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-bold text-white truncate">{item.product.nombre}</h4>
                      <p className="text-[10px] text-slate-400 font-mono-tech mt-0.5">
                        {formatCurrency(price)} c/u
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 whitespace-nowrap">
                      {formatCurrency(price * item.cantidad)}
                    </span>
                  </div>

                  {/* Notas y Controles */}
                  <div className="flex items-center gap-3 pt-1 justify-between">
                    <input
                      type="text"
                      placeholder="Nota (Ej: Sin cebolla)"
                      value={item.notas || ''}
                      onChange={(e) => updateItemNotes(item.product.id, e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-white focus:outline-none focus:border-emerald-500"
                    />

                    {/* +/- controles */}
                    <div className="flex items-center gap-1.5 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-5 h-5 rounded-md hover:bg-slate-800 text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-white px-1.5 min-w-[20px] text-center">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => addToCart(item.product)}
                        className="w-5 h-5 rounded-md hover:bg-slate-800 text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Formulario Cliente, Modalidad y Pago */}
        <form onSubmit={handleCreateOrder} className="border-t border-white/10 pt-4 space-y-4 bg-slate-950/20 -mx-5 -mb-5 p-5 rounded-b-3xl">
          
          {/* Modalidades de Entrega */}
          <div>
            <label className="block text-[10px] font-display font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Tipo de Entrega
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'mesa', label: 'En Local' },
                { value: 'retiro_local', label: 'Llevar' },
                { value: 'domicilio', label: 'Domicilio' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTipoEntrega(opt.value as any)}
                  className={`py-1.5 rounded-xl text-[11px] font-display font-bold border transition-all cursor-pointer ${
                    tipoEntrega === opt.value
                      ? 'bg-emerald-500/10 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Datos cliente / Mesa */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-display font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Nombre Cliente
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500">
                  <User className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  required
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="w-full pl-7.5 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {tipoEntrega === 'mesa' ? (
              <div>
                <label className="block text-[10px] font-display font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Número Mesa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 5"
                  value={numeroMesa}
                  onChange={(e) => setNumeroMesa(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-display font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Teléfono (WhatsApp)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="tel"
                    placeholder="09..."
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="w-full pl-7.5 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Configuración del Pago */}
          <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
            <div>
              <label className="block text-[10px] font-display font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Método de Pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="payphone">PayPhone</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-display font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Estado Pago
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEstadoPago('pagado')}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                    estadoPago === 'pagado'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Cobrado
                </button>
                <button
                  type="button"
                  onClick={() => setEstadoPago('pendiente')}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                    estadoPago === 'pendiente'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Por Cobrar
                </button>
              </div>
            </div>
          </div>

          {/* Totales Cuenta */}
          <div className="border-t border-white/10 pt-3 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(getSubtotal())}</span>
            </div>
            {tipoEntrega === 'domicilio' && (
              <div className="flex justify-between text-xs text-slate-400">
                <span>Costo Envío:</span>
                <span className="font-mono">{formatCurrency(getCostoEnvio())}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-bold text-white pt-1 border-t border-white/5">
              <span>Total a Cobrar:</span>
              <span className="text-md font-mono-tech text-emerald-400">{formatCurrency(getTotal())}</span>
            </div>
          </div>

          {/* Acciones del Formulario */}
          <div className="flex gap-2 pt-1.5">
            <button
              type="button"
              onClick={clearCart}
              className="px-3.5 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Vaciar Carrito"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={isSaving || cart.length === 0}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-display font-black text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              <span>{isSaving ? 'Registrando...' : 'Registrar Pedido'}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  </div>
  );
}
