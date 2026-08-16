'use client';

import React, { useState, useEffect, use } from 'react';
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
  ArrowLeft,
  Maximize2,
  Minimize2,
  Lock,
  Unlock,
  TrendingUp,
  Coins,
  FileText,
  ChevronDown,
} from 'lucide-react';
import type { BillingData } from '@/lib/types/database';
import { toast } from '@/lib/utils/toast';
import { Product, Category, Order, CartItem } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/currency';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { ProductVariantsDrawer } from '@/components/catalog/ProductVariantsDrawer';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { Clock, CheckCircle2, AlertTriangle, Truck, ShoppingBag, Eye, Printer } from 'lucide-react';
import { TicketThermal } from '@/components/ticket/TicketThermal';

export default function CajaPOSPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const { business, loading: loadingBusiness } = useAdminBusiness(slug);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [simulatedRole, setSimulatedRole] = useState<'dueño' | 'cajero-1' | 'cajero-2' | 'cocinero'>('cajero-1');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = (localStorage.getItem('kaltiro_simulated_role') || 'dueño') as any;
      setSimulatedRole(role);
    }
  }, []);

  // Filtros y búsqueda
  const [activeCategory, setActiveCategory] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Pestaña activa dentro de la Caja: 'pos' (Toma de pedidos) o 'pedidos' (Monitor Pedidos en Vivo)
  const [activeTab, setActiveTab] = useState<'pos' | 'pedidos'>('pos');

  // Suscripción Realtime a Pedidos
  const { orders: liveOrders, updateOrderStatusLocal: updateOrderStatus } = useRealtimeOrders(business?.id || '');

  // Estado del Carrito POS
  const [cart, setCart] = useState<CartItem[]>([]);

  // Datos del Cliente y Pago
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState<'domicilio' | 'retiro_local' | 'mesa'>('mesa');
  const [numeroMesa, setNumeroMesa] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'payphone'>('efectivo');
  const [estadoPago, setEstadoPago] = useState<'pendiente' | 'pagado'>('pagado');

  // Imprimir ticket
  const [printOrder, setPrintOrder] = useState<any | null>(null);

  React.useEffect(() => {
    if (!printOrder) return;
    const timer = setTimeout(() => {
      window.print();
      setPrintOrder(null);
    }, 150); // pequeño delay para que el DOM se renderice
    return () => clearTimeout(timer);
  }, [printOrder]);

  // Modal editar pedido
  const [editOrder, setEditOrder] = useState<any | null>(null);
  const [editRequiereFactura, setEditRequiereFactura] = useState(false);
  const [editDatosFact, setEditDatosFact] = useState<BillingData>({ tipo_doc: 'CEDULA', num_doc: '', razon_social: '', email: '', direccion: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEditModal = (order: any) => {
    setEditOrder(order);
    setEditRequiereFactura(order.requiere_factura ?? false);
    setEditDatosFact(order.datos_facturacion ?? { tipo_doc: 'CEDULA', num_doc: '', razon_social: '', email: '', direccion: '' });
  };

  const saveEditOrder = async () => {
    if (!editOrder) return;
    setIsSavingEdit(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('orders')
        .update({
          requiere_factura: editRequiereFactura,
          datos_facturacion: editRequiereFactura ? editDatosFact : null,
        })
        .eq('id', editOrder.id);
      if (error) throw error;
      toast.success('Pedido actualizado correctamente');
      setEditOrder(null);
    } catch (err: any) {
      toast.error(err.message ?? 'Error actualizando pedido');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Factura electrónica
  const [requiereFactura, setRequiereFactura] = useState(false);
  const [datosFact, setDatosFact] = useState<BillingData>({
    tipo_doc: 'CEDULA',
    num_doc: '',
    razon_social: '',
    email: '',
    direccion: '',
  });

  // CRM autocomplete
  const [crmQuery, setCrmQuery] = useState('');
  const [crmResults, setCrmResults] = useState<{ nombre: string; telefono: string }[]>([]);
  const [showCrmDrop, setShowCrmDrop] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Estado del drawer de variantes/opciones
  const [selectedProductForDrawer, setSelectedProductForDrawer] = useState<Product | null>(null);

  // Estados de Turnos y Caja Chica
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [activeRegister, setActiveRegister] = useState<any | null>(null);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  
  // Formulario Apertura
  const [nombreCaja, setNombreCaja] = useState('Caja 1');
  const [montoApertura, setMontoApertura] = useState('50.00');
  const [isSavingShift, setIsSavingShift] = useState(false);

  // Formulario Caja Chica
  const [showTxModal, setShowTxModal] = useState(false);
  const [txTipo, setTxTipo] = useState<'ingreso' | 'egreso'>('egreso');
  const [txMonto, setTxMonto] = useState('');
  const [txMotivo, setTxMotivo] = useState('');
  const [isSavingTx, setIsSavingTx] = useState(false);

  // Formulario Cierre
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [salesReport, setSalesReport] = useState<{
    efectivo: number;
    transferencia: number;
    payphone: number;
  }>({ efectivo: 0, transferencia: 0, payphone: 0 });
  const [montoDeclarado, setMontoDeclarado] = useState('');
  const [comentariosArqueo, setComentariosArqueo] = useState('');
  const [isClosingShift, setIsClosingShift] = useState(false);

  // Verificar turno activo
  const checkActiveShift = async () => {
    if (!business) return;
    const role = localStorage.getItem('kaltiro_simulated_role') || 'dueño';
    
    if (role === 'dueño') {
      setActiveShift({ id: 'mock-dueño-shift', rol_ejecutado: 'dueño' });
      setActiveRegister({ id: 'mock-dueño-register', nombre_caja: 'Caja Admin' });
      setShowOpenShiftModal(false);
      return;
    }

    const supabase = createClient();
    const { data: shiftData, error } = await supabase
      .from('business_shifts')
      .select('*, cash_registers(*)')
      .eq('business_id', business.id)
      .eq('rol_ejecutado', role)
      .eq('estado', 'abierto')
      .maybeSingle();

    if (shiftData) {
      setActiveShift(shiftData);
      if (shiftData.cash_registers && shiftData.cash_registers.length > 0) {
        setActiveRegister(shiftData.cash_registers[0]);
      } else {
        setActiveRegister(null);
      }
      setShowOpenShiftModal(false);
    } else {
      setActiveShift(null);
      setActiveRegister(null);
      setShowOpenShiftModal(true);
    }
  };

  useEffect(() => {
    if (business) {
      checkActiveShift();
    }
  }, [business]);

  // Establecer nombre de caja por defecto
  useEffect(() => {
    const role = localStorage.getItem('kaltiro_simulated_role') || 'dueño';
    if (role === 'cajero-1') {
      setNombreCaja('Caja Principal');
    } else if (role === 'cajero-2') {
      setNombreCaja('Caja Barra');
    } else {
      setNombreCaja('Caja 1');
    }
  }, []);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setIsSavingShift(true);

    const role = localStorage.getItem('kaltiro_simulated_role') || 'dueño';

    try {
      const supabase = createClient();
      
      const { data: shiftData, error: shiftError } = await supabase
        .from('business_shifts')
        .insert({
          business_id: business.id,
          rol_ejecutado: role,
          estado: 'abierto'
        })
        .select()
        .single();

      if (shiftError) throw shiftError;

      const { data: registerData, error: registerError } = await supabase
        .from('cash_registers')
        .insert({
          shift_id: shiftData.id,
          nombre_caja: nombreCaja,
          monto_apertura: Number(montoApertura)
        })
        .select()
        .single();

      if (registerError) throw registerError;

      toast.success(`Turno abierto con éxito en ${nombreCaja}.`);
      setActiveShift(shiftData);
      setActiveRegister(registerData);
      setShowOpenShiftModal(false);
    } catch (err: any) {
      console.error('Error al abrir turno:', err);
      toast.error(`Error al abrir caja: ${err.message || err}`);
    } finally {
      setIsSavingShift(false);
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRegister || activeRegister.id === 'mock-dueño-register') {
      toast.error('El administrador no registra movimientos manuales en modo simulación.');
      setShowTxModal(false);
      return;
    }
    if (Number(txMonto) <= 0) {
      toast.error('El monto debe ser mayor a 0.');
      return;
    }
    if (!txMotivo.trim()) {
      toast.error('Por favor ingresa un motivo para el movimiento.');
      return;
    }

    setIsSavingTx(true);

    try {
      const supabase = createClient();
      
      const { error: txError } = await supabase
        .from('cash_transactions')
        .insert({
          register_id: activeRegister.id,
          tipo: txTipo,
          monto: Number(txMonto),
          motivo: txMotivo.trim()
        });

      if (txError) throw txError;

      const field = txTipo === 'ingreso' ? 'ingresos_manuales_efectivo' : 'egresos_manuales_efectivo';
      const currentAmount = activeRegister[field] || 0;
      const newAmount = Number(currentAmount) + Number(txMonto);

      const { data: updatedRegister, error: updateError } = await supabase
        .from('cash_registers')
        .update({ [field]: newAmount })
        .eq('id', activeRegister.id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast.success('Movimiento de caja chica registrado con éxito.');
      setActiveRegister(updatedRegister);
      setShowTxModal(false);
      setTxMonto('');
      setTxMotivo('');
    } catch (err: any) {
      console.error('Error guardando transacción de caja:', err);
      toast.error(`Error de base de datos: ${err.message || err}`);
    } finally {
      setIsSavingTx(false);
    }
  };

  const prepareCloseShift = async () => {
    if (!activeShift || !activeRegister) return;
    if (activeShift.id === 'mock-dueño-shift') {
      toast.error('El administrador no cierra turno en modo simulación.');
      return;
    }
    setLoading(true);

    try {
      const supabase = createClient();
      
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('total, metodo_pago')
        .eq('shift_id', activeShift.id);

      if (error) throw error;

      let efectivo = 0;
      let transferencia = 0;
      let payphone = 0;

      if (ordersData) {
        ordersData.forEach((order: any) => {
          if (order.metodo_pago === 'efectivo') efectivo += Number(order.total);
          else if (order.metodo_pago === 'transferencia') transferencia += Number(order.total);
          else if (order.metodo_pago === 'payphone') payphone += Number(order.total);
        });
      }

      setSalesReport({ efectivo, transferencia, payphone });
      setShowCloseModal(true);
    } catch (err: any) {
      console.error('Error calculando arqueo:', err);
      toast.error(`Error al obtener ventas del turno: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift || !activeRegister) return;
    if (montoDeclarado === '') {
      toast.error('Por favor ingresa el monto de efectivo contado.');
      return;
    }

    setIsClosingShift(true);

    const efectivoEsperado = 
      Number(activeRegister.monto_apertura) + 
      salesReport.efectivo + 
      Number(activeRegister.ingresos_manuales_efectivo || 0) - 
      Number(activeRegister.egresos_manuales_efectivo || 0);

    const diferencia = Number(montoDeclarado) - efectivoEsperado;

    try {
      const supabase = createClient();
      
      const { error: shiftError } = await supabase
        .from('business_shifts')
        .update({
          estado: 'cerrado',
          fecha_cierre: new Date().toISOString()
        })
        .eq('id', activeShift.id);

      if (shiftError) throw shiftError;

      const { error: registerError } = await supabase
        .from('cash_registers')
        .update({
          monto_cierre_declarado: Number(montoDeclarado),
          ventas_efectivo_calculado: salesReport.efectivo,
          ventas_transferencia_calculado: salesReport.transferencia,
          ventas_payphone_calculado: salesReport.payphone,
          diferencia_efectivo: diferencia,
          comentarios_auditoria: comentariosArqueo.trim() || null
        })
        .eq('id', activeRegister.id);

      if (registerError) throw registerError;

      toast.success('¡Caja cerrada correctamente! Turno finalizado.');
      
      setShowCloseModal(false);
      setMontoDeclarado('');
      setComentariosArqueo('');
      
      await checkActiveShift();
    } catch (err: any) {
      console.error('Error cerrando turno:', err);
      toast.error(`Error al guardar arqueo de caja: ${err.message || err}`);
    } finally {
      setIsClosingShift(false);
    }
  };

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

  // Abrir drawer de opciones o agregar directo al carrito
  const addToCart = (product: Product) => {
    // Abrimos siempre el drawer para opciones/notas/cantidad
    setSelectedProductForDrawer(product);
  };

  // Agregar con opciones seleccionadas desde el drawer
  const addToCartWithOptions = (product: Product, qty: number, notas: string, opciones?: CartItem['opciones_seleccionadas']) => {
    setCart((prev) => {
      const key = JSON.stringify({ id: product.id, notas, opciones: opciones || [] });
      const existing = prev.find((item) => JSON.stringify({ id: item.product.id, notas: item.notas, opciones: item.opciones_seleccionadas || [] }) === key);
      if (existing) {
        return prev.map((item) => {
          const itemKey = JSON.stringify({ id: item.product.id, notas: item.notas, opciones: item.opciones_seleccionadas || [] });
          return itemKey === key ? { ...item, cantidad: item.cantidad + qty } : item;
        });
      }
      return [...prev, { product, cantidad: qty, notas, opciones_seleccionadas: opciones }];
    });
    setSelectedProductForDrawer(null);
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

  // Búsqueda CRM
  const searchCrm = async (q: string) => {
    setCrmQuery(q);
    setClienteNombre(q);
    if (!business || q.trim().length < 2) { setCrmResults([]); setShowCrmDrop(false); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('business_customers')
      .select('nombre, telefono')
      .eq('business_id', business.id)
      .ilike('nombre', `%${q}%`)
      .limit(6);
    setCrmResults(data ?? []);
    setShowCrmDrop((data?.length ?? 0) > 0);
  };

  const selectCrmCustomer = (c: { nombre: string; telefono: string }) => {
    setClienteNombre(c.nombre);
    setClienteTelefono(c.telefono);
    setCrmQuery(c.nombre);
    setShowCrmDrop(false);
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
    setRequiereFactura(false);
    setDatosFact({ tipo_doc: 'CEDULA', num_doc: '', razon_social: '', email: '', direccion: '' });
    setCrmQuery('');
    setCrmResults([]);
  };

  // Cálculo de totales
  const getSubtotal = () => {
    return cart.reduce((acc, item) => {
      const price = item.product.en_oferta && item.product.precio_oferta ? item.product.precio_oferta : item.product.precio;
      const optionsCost = item.opciones_seleccionadas?.reduce((sum, opt) => sum + Number(opt.precio_adicional || 0), 0) || 0;
      return acc + (price + optionsCost) * item.cantidad;
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
      estado: 'pendiente',
      shift_id: activeShift && activeShift.id !== 'mock-dueño-shift' ? activeShift.id : null,
      requiere_factura: requiereFactura,
      datos_facturacion: requiereFactura ? datosFact : null,
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
      const channelName = `kaltiro-orders-${business.id}`;
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
        <Store className="w-8 h-8 text-brand-400 animate-pulse" />
        <p className="text-slate-400 text-xs font-medium">Cargando catálogo de Caja POS...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#070A11] text-slate-100 overflow-hidden w-full select-none">
      
      {/* Header de Caja POS (Adaptado a Móvil) */}
      <header className="h-auto sm:h-16 border-b border-white/10 bg-[#0B0F1B] px-4 sm:px-6 py-2.5 sm:py-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 z-20 w-full">
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            {simulatedRole === 'dueño' && (
              <Link
                href={`/${slug}/admin/dashboard`}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
                title="Volver al panel"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
            <div className="flex items-center gap-1.5">
              <Store className="w-4 h-4 sm:w-5 sm:h-5 text-brand-400 shrink-0" />
              <h1 className="font-display font-black text-xs sm:text-base tracking-tight text-white truncate">
                Caja & POS
              </h1>
              <span className="hidden md:inline-block text-[10px] font-mono-tech font-bold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/25">
                {business?.nombre}
              </span>
            </div>
          </div>

          {/* Switcher de Pestañas Rápidas */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-display font-bold flex items-center gap-1 transition-all ${
                activeTab === 'pos'
                  ? 'bg-brand-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">Comanda</span>
            </button>

            <button
              onClick={() => setActiveTab('pedidos')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-display font-bold flex items-center gap-1 transition-all relative ${
                activeTab === 'pedidos'
                  ? 'bg-brand-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">En Vivo</span>
              {liveOrders.filter(o => o.estado !== 'entregado' && o.estado !== 'cancelado').length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {liveOrders.filter(o => o.estado !== 'entregado' && o.estado !== 'cancelado').length}
                </span>
              )}
            </button>
          </div>
        </div>


        <div className="hidden sm:flex items-center gap-2">
          {/* Movimientos de Caja Chica */}
          {activeRegister && activeRegister.id !== 'mock-dueño-register' && (
            <button
              onClick={() => setShowTxModal(true)}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Movimientos de Caja Chica (Gastos/Ingresos)"
            >
              <Coins className="w-4 h-4" />
              <span className="hidden md:inline">Caja Chica</span>
            </button>
          )}

          {/* Cerrar Caja */}
          {activeShift && activeShift.id !== 'mock-dueño-shift' && (
            <button
              onClick={prepareCloseShift}
              className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Cerrar Turno de Caja"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden md:inline">Cerrar Caja</span>
            </button>
          )}

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

      {/* Main Workspace: Condicional según la pestaña seleccionada */}
      {activeTab === 'pedidos' ? (
        /* VISTA: MONITOR DE PEDIDOS EN VIVO DENTRO DE CAJA */
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-black text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-400" />
                Monitor de Pedidos en Vivo
              </h2>
              <p className="text-xs text-slate-400">
                Supervisa y actualiza el estado de las comandas recibidas en tiempo real.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('pos')}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-display font-bold text-xs flex items-center gap-2 shadow-lg shadow-brand-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Comanda POS</span>
            </button>
          </div>

          {liveOrders.length === 0 ? (
            <div className="bg-[#0B0F1B] border border-white/10 rounded-2xl p-12 text-center text-slate-500">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-700 animate-pulse" />
              <p className="text-sm font-bold text-slate-400">No hay pedidos registrados hoy.</p>
              <p className="text-xs text-slate-600 mt-1">Los nuevos pedidos ingresados desde la Caja o la Web aparecerán aquí en vivo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveOrders.map((order) => {
                const getStatusColor = (st: string) => {
                  switch (st) {
                    case 'pendiente': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                    case 'en_preparacion': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
                    case 'listo': return 'bg-brand-500/10 text-brand-400 border-brand-500/30';
                    case 'entregado': return 'bg-slate-800 text-slate-400 border-slate-700';
                    default: return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                  }
                };

                return (
                  <div key={order.id} className="bg-[#0B0F1B] border border-white/10 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-lg">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono-tech font-black text-sm text-brand-400">
                          #{String(order.numero_pedido).padStart(4, '0')}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-tech font-bold uppercase border ${getStatusColor(order.estado)}`}>
                          {order.estado.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        <p className="font-bold text-white">{order.cliente_nombre}</p>
                        <p className="text-[11px] text-slate-400">{order.tipo_entrega === 'mesa' ? `Mesa: ${order.numero_mesa || 'N/A'}` : order.tipo_entrega}</p>
                      </div>

                      {/* Items */}
                      <div className="border-t border-white/5 pt-2 space-y-1">
                        {((order as any).items || []).map((it: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-[11px] text-slate-300">
                            <span>{it.cantidad}x {it.product?.nombre || 'Producto'}</span>
                            <span className="font-mono text-slate-400">{formatCurrency((it.precio_unitario || 0) * it.cantidad)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tech font-bold text-sm text-brand-400">{formatCurrency(order.total)}</span>
                        {order.requiere_factura && (
                          <span className="px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[9px] font-mono-tech font-bold">FAC</span>
                        )}
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setPrintOrder(order)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold flex items-center gap-1"
                          title="Imprimir ticket"
                        >
                          <Printer className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openEditModal(order)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" /> Editar
                        </button>
                        {order.estado === 'pendiente' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'en_preparacion')}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[10px] font-bold"
                          >
                            Cocinar
                          </button>
                        )}
                        {order.estado === 'en_preparacion' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'listo')}
                            className="px-2.5 py-1 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 text-[10px] font-bold"
                          >
                            Listo
                          </button>
                        )}
                        {order.estado === 'listo' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'entregado')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-[10px] font-bold"
                          >
                            Entregar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VISTA: POS - SECCIÓN DE COMANDAS (Layout Móvil Optimizado) */
        <div className="flex-1 flex flex-col xl:flex-row gap-4 p-3 sm:p-6 overflow-y-auto sm:overflow-hidden min-h-0 w-full">
          
          {/* SECCIÓN IZQUIERDA: Búsqueda, Categorías y Catálogo */}
          <div className="flex-1 flex flex-col space-y-3 min-w-0">
          
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
                className="w-full pl-9 pr-4 py-2 bg-[#0B0F1B] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

        {/* Categorías Scroller Horizontal (Táctil Móvil) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0 shrink-0">
          <button
            onClick={() => setActiveCategory('todas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-bold whitespace-nowrap transition-all shrink-0 ${
              activeCategory === 'todas'
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md'
                : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-bold whitespace-nowrap transition-all shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md'
                  : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* Catálogo de Productos */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 min-h-[220px]">
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
                  className="bg-[#0B0F1B] border border-white/5 hover:border-brand-500/40 rounded-xl p-2 flex flex-col justify-between cursor-pointer group active:scale-95 transition-all shadow-md relative overflow-hidden h-40 sm:h-48"
                >
                  {/* Foto o fallback */}
                  <div className="w-full h-18 sm:h-24 rounded-lg bg-slate-950 flex items-center justify-center overflow-hidden relative border border-white/5 shrink-0">
                    {p.imagen_url ? (
                      <img 
                        src={p.imagen_url} 
                        alt={p.nombre} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Store className="w-5 h-5 text-slate-700" />
                    )}

                    {p.en_oferta && (
                      <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-amber-500 text-slate-950 text-[8px] font-black uppercase tracking-wider">
                        PROMO
                      </div>
                    )}
                  </div>

                  {/* Detalles */}
                  <div className="space-y-0.5 py-1 min-w-0 flex-1 overflow-hidden">
                    <h4 className="text-[11px] sm:text-xs font-display font-extrabold text-white line-clamp-1 group-hover:text-brand-400 transition-colors leading-tight">
                      {p.nombre}
                    </h4>
                    <p className="text-[9px] text-slate-400 line-clamp-1 leading-normal">
                      {p.descripcion || 'Sin descripción.'}
                    </p>
                  </div>

                  {/* Precio & Acción */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 mt-auto text-slate-500 group-hover:text-brand-400 transition-colors shrink-0">
                    <span className="text-[11px] sm:text-xs font-mono font-black text-brand-400">
                      {formatCurrency(displayPrice)}
                    </span>
                    <span className="text-[8px] font-display font-black tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                      + AÑADIR
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECCIÓN DERECHA: Resumen de Cuenta & Formulario */}
      <div className="w-full xl:w-[400px] bg-[#0B0F1B] border border-white/10 rounded-3xl flex flex-col h-full shadow-2xl shrink-0 overflow-hidden">

        {/* Ticket Header — fijo arriba */}
        <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between shrink-0">
          <h3 className="font-display font-black text-sm text-white flex items-center gap-2">
            <ShoppingCart className="w-4.5 h-4.5 text-brand-400" />
            <span>Resumen del Pedido</span>
          </h3>
          <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-white/5 text-slate-400">
            {cart.reduce((acc, item) => acc + item.cantidad, 0)} ítems
          </span>
        </div>

        {/* Todo el contenido scrolleable: items + form */}
        <div className="flex-1 overflow-y-auto">

        {/* Lista del Carrito */}
        <div className="px-5 py-3 space-y-3.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 text-center">
              <ShoppingCart className="w-8 h-8 mb-2 text-slate-700 animate-bounce" />
              <p className="text-xs">Selecciona productos a la izquierda para armar la comanda.</p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const price = item.product.en_oferta && item.product.precio_oferta ? item.product.precio_oferta : item.product.precio;
              const optionsCost = item.opciones_seleccionadas?.reduce((sum, opt) => sum + Number(opt.precio_adicional || 0), 0) || 0;
              const unitPrice = price + optionsCost;
              return (
                <div key={idx} className="p-3 bg-slate-950/70 border border-white/5 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-bold text-white truncate">{item.product.nombre}</h4>
                      {/* Opciones seleccionadas */}
                      {item.opciones_seleccionadas && item.opciones_seleccionadas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.opciones_seleccionadas.map((opt, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-400 font-medium">
                              {opt.opcion_nombre}{opt.precio_adicional > 0 ? ` +${formatCurrency(opt.precio_adicional)}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 font-mono-tech mt-0.5">
                        {formatCurrency(unitPrice)} c/u
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-brand-400 whitespace-nowrap">
                      {formatCurrency(unitPrice * item.cantidad)}
                    </span>
                  </div>

                  {/* Notas y Controles */}
                  <div className="flex items-center gap-3 pt-1 justify-between">
                    <input
                      type="text"
                      placeholder="Nota (Ej: Sin cebolla)"
                      value={item.notas || ''}
                      onChange={(e) => updateItemNotes(item.product.id, e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-white focus:outline-none focus:border-brand-500"
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
        <form onSubmit={handleCreateOrder} className="border-t border-white/10 pt-4 space-y-4 bg-slate-950/20 px-5 pb-5">
          
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
                      ? 'bg-brand-500/10 border-brand-500 text-white'
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
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 z-10">
                  <User className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  required
                  value={crmQuery || clienteNombre}
                  onChange={(e) => searchCrm(e.target.value)}
                  onFocus={() => crmResults.length > 0 && setShowCrmDrop(true)}
                  onBlur={() => setTimeout(() => setShowCrmDrop(false), 150)}
                  className="w-full pl-7 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
                {showCrmDrop && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#0D1322] border border-white/10 rounded-xl overflow-hidden shadow-xl">
                    {crmResults.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => selectCrmCustomer(c)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-brand-500/10 text-left transition-colors"
                      >
                        <User className="w-3 h-3 text-brand-400 shrink-0" />
                        <div>
                          <p className="text-xs text-white font-medium">{c.nombre}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{c.telefono}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
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
                    className="w-full pl-7.5 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
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
              <CustomSelect
                options={[
                  { value: 'efectivo', label: 'Efectivo' },
                  { value: 'transferencia', label: 'Transferencia' },
                  { value: 'payphone', label: 'PayPhone' }
                ]}
                value={metodoPago}
                onChange={(val) => setMetodoPago(val as any)}
                accentColor="brand"
                className="text-xs"
              />
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
                      ? 'bg-brand-500/10 border-brand-500 text-brand-400'
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

          {/* Factura Electrónica */}
          {business?.has_facturacion_sri && (
            <div className="border-t border-white/5 pt-3 space-y-3">
              <button
                type="button"
                onClick={() => setRequiereFactura(!requiereFactura)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                  requiereFactura
                    ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-2 text-[11px] font-display font-bold">
                  <FileText className="w-3.5 h-3.5" />
                  Requiere Factura Electrónica
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${requiereFactura ? 'rotate-180' : ''}`} />
              </button>

              {requiereFactura && (
                <div className="space-y-2 bg-slate-950/60 rounded-xl p-3 border border-white/5">
                  {/* Tipo documento */}
                  <div className="grid grid-cols-3 gap-1">
                    {(['CEDULA', 'RUC', 'PASAPORTE'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDatosFact(prev => ({ ...prev, tipo_doc: t }))}
                        className={`py-1 rounded-lg text-[9px] font-mono-tech font-bold border transition-all ${
                          datosFact.tipo_doc === t
                            ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder={datosFact.tipo_doc === 'RUC' ? 'RUC (13 dígitos)' : datosFact.tipo_doc === 'CEDULA' ? 'Cédula (10 dígitos)' : 'Pasaporte'}
                    value={datosFact.num_doc}
                    onChange={e => setDatosFact(prev => ({ ...prev, num_doc: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="Razón Social"
                    value={datosFact.razon_social}
                    onChange={e => setDatosFact(prev => ({ ...prev, razon_social: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                  <input
                    type="email"
                    placeholder="Email (para enviar la factura)"
                    value={datosFact.email}
                    onChange={e => setDatosFact(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="Dirección fiscal"
                    value={datosFact.direccion}
                    onChange={e => setDatosFact(prev => ({ ...prev, direccion: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}
            </div>
          )}

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
              <span className="text-md font-mono-tech text-brand-400">{formatCurrency(getTotal())}</span>
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
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-slate-950 font-display font-black text-xs tracking-wider uppercase shadow-lg shadow-brand-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              <span>{isSaving ? 'Registrando...' : 'Registrar Pedido'}</span>
            </button>
          </div>
        </form>
        </div>{/* fin contenedor scrolleable */}
      </div>
    </div>
    )}

    {/* ========================================== */}
    {/* TICKET DE IMPRESIÓN (oculto en pantalla)   */}
    {/* ========================================== */}
    {printOrder && business && (
      <>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body > * { display: none !important; }
            #kaltiro-print-ticket { display: block !important; position: fixed; inset: 0; z-index: 99999; background: white; }
          }
        `}} />
        <div id="kaltiro-print-ticket" style={{ display: 'none' }}>
          <TicketThermal
            order={{ ...printOrder, items: printOrder.items ?? [] }}
            business={business}
          />
        </div>
      </>
    )}

    {/* ========================================== */}
    {/* MODAL EDITAR PEDIDO                        */}
    {/* ========================================== */}
    {editOrder && (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-[#0D1322] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
            <div>
              <h3 className="font-display font-black text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                Editar Pedido #{String(editOrder.numero_pedido).padStart(4, '0')}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{editOrder.cliente_nombre} · {formatCurrency(editOrder.total)}</p>
            </div>
            <button
              onClick={() => setEditOrder(null)}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* Items del pedido (read-only) */}
            <div>
              <p className="text-[10px] font-mono-tech font-bold text-slate-500 uppercase mb-2">Ítems del pedido</p>
              <div className="space-y-1.5">
                {((editOrder as any).items || []).map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-300 bg-slate-950/50 px-3 py-1.5 rounded-lg">
                    <span>{it.cantidad}× {it.product?.nombre || 'Producto'}</span>
                    <span className="font-mono text-slate-400">{formatCurrency((it.precio_unitario || 0) * it.cantidad)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección Factura */}
            <div className="border-t border-white/5 pt-3 space-y-3">
              <p className="text-[10px] font-mono-tech font-bold text-slate-500 uppercase">Factura Electrónica</p>

              <button
                type="button"
                onClick={() => setEditRequiereFactura(!editRequiereFactura)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                  editRequiereFactura
                    ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-2 text-xs font-display font-bold">
                  <Receipt className="w-3.5 h-3.5" />
                  {editRequiereFactura ? 'Requiere factura — activo' : 'Sin factura (Consumidor Final)'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${editRequiereFactura ? 'rotate-180' : ''}`} />
              </button>

              {editRequiereFactura && (
                <div className="space-y-2 bg-slate-950/60 rounded-xl p-3 border border-white/5">
                  <div className="grid grid-cols-3 gap-1">
                    {(['CEDULA', 'RUC', 'PASAPORTE'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEditDatosFact(prev => ({ ...prev, tipo_doc: t }))}
                        className={`py-1.5 rounded-lg text-[9px] font-mono-tech font-bold border transition-all ${
                          editDatosFact.tipo_doc === t
                            ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder={editDatosFact.tipo_doc === 'RUC' ? 'RUC (13 dígitos)' : editDatosFact.tipo_doc === 'CEDULA' ? 'Cédula (10 dígitos)' : 'Pasaporte'}
                    value={editDatosFact.num_doc}
                    onChange={e => setEditDatosFact(prev => ({ ...prev, num_doc: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="Razón Social"
                    value={editDatosFact.razon_social}
                    onChange={e => setEditDatosFact(prev => ({ ...prev, razon_social: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                  <input
                    type="email"
                    placeholder="Email (para enviar la factura)"
                    value={editDatosFact.email}
                    onChange={e => setEditDatosFact(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="Dirección fiscal"
                    value={editDatosFact.direccion}
                    onChange={e => setEditDatosFact(prev => ({ ...prev, direccion: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer con acciones */}
          <div className="px-5 py-4 border-t border-white/10 flex gap-2 shrink-0">
            <button
              onClick={() => setEditOrder(null)}
              className="flex-1 py-2.5 rounded-2xl bg-slate-900 border border-white/10 text-slate-300 text-xs font-display font-bold hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={saveEditOrder}
              disabled={isSavingEdit}
              className="flex-1 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white text-xs font-display font-bold transition-colors shadow-lg shadow-brand-500/20 flex items-center justify-center gap-1.5"
            >
              {isSavingEdit ? 'Guardando...' : '✓ Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ========================================== */}
    {/* MODAL 1: APERTURA DE CAJA (LOCK SCREEN)    */}
    {/* ========================================== */}
    {showOpenShiftModal && (
      <div className="fixed inset-0 z-50 bg-[#070A11]/95 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0B0F1B] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-xl font-display font-black text-white tracking-tight">Caja Registradora Cerrada</h2>
            <p className="text-xs text-slate-400">
              Debes abrir turno e ingresar el fondo de caja inicial para comenzar a facturar en {business?.nombre}.
            </p>
          </div>

          <form onSubmit={handleOpenShift} className="space-y-4">
            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Nombre / Identificador de Caja</label>
              <input
                type="text"
                required
                value={nombreCaja}
                onChange={(e) => setNombreCaja(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Monto Inicial (Fondo de Caja en Efectivo)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  placeholder="0.00"
                  value={montoApertura}
                  onChange={(e) => setMontoApertura(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Ingresa el dinero físico fraccionario con el que cuentas en la gaveta para dar vueltos.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSavingShift}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-display font-black text-xs tracking-wider uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-bold"
            >
              {isSavingShift ? 'Abriendo Caja...' : 'Iniciar Turno & Abrir Caja'}
            </button>
          </form>
        </div>
      </div>
    )}

    {/* ========================================== */}
    {/* MODAL 2: CAJA CHICA (INGRESOS / EGRESOS)   */}
    {/* ========================================== */}
    {showTxModal && (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0B0F1B] border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-display font-black text-sm text-white flex items-center gap-2">
              <Coins className="w-4.5 h-4.5 text-amber-400" />
              <span>Movimiento de Caja Chica</span>
            </h3>
            <button 
              onClick={() => setShowTxModal(false)}
              className="text-slate-400 hover:text-white text-xs font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-white/5 cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          <form onSubmit={handleSaveTransaction} className="space-y-4">
            {/* Tipo de movimiento */}
            <div>
              <label className="block text-[10px] font-display font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Tipo de Movimiento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxTipo('egreso')}
                  className={`py-2 rounded-xl text-xs font-display font-bold border transition-all cursor-pointer ${
                    txTipo === 'egreso'
                      ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Gasto / Retiro (Egreso)
                </button>
                <button
                  type="button"
                  onClick={() => setTxTipo('ingreso')}
                  className={`py-2 rounded-xl text-xs font-display font-bold border transition-all cursor-pointer ${
                    txTipo === 'ingreso'
                      ? 'bg-brand-500/10 border-brand-500 text-brand-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Ingresar Sencillo
                </button>
              </div>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-[10px] font-display font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Monto ($)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  placeholder="0.00"
                  value={txMonto}
                  onChange={(e) => setTxMonto(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-[10px] font-display font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Motivo / Justificación
              </label>
              <textarea
                required
                rows={3}
                placeholder="Ej: Compra de gas de repuesto o inyección de vuelto de $1.00"
                value={txMotivo}
                onChange={(e) => setTxMotivo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingTx}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-display font-black text-xs tracking-wider uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-bold"
            >
              {isSavingTx ? 'Guardando...' : 'Registrar Transacción'}
            </button>
          </form>
        </div>
      </div>
    )}

    {/* ========================================== */}
    {/* MODAL 3: ARQUEO Y CIERRE DE CAJA           */}
    {/* ========================================== */}
    {showCloseModal && activeRegister && (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#0B0F1B] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-display font-black text-sm text-white flex items-center gap-2">
              <Lock className="w-4.5 h-4.5 text-rose-400 animate-pulse" />
              <span>Arqueo y Cierre de Caja — {activeRegister.nombre_caja}</span>
            </h3>
            <button 
              onClick={() => setShowCloseModal(false)}
              className="text-slate-400 hover:text-white text-xs font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-white/5 cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          {/* Resumen confidencial de ventas */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-3.5">
            <h4 className="text-[10px] font-mono-tech font-bold uppercase tracking-wider text-slate-400">Resumen Financiero del Turno</h4>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Fondo de Apertura</span>
                <span className="text-white font-mono font-extrabold text-sm">{formatCurrency(activeRegister.monto_apertura)}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Ventas en Efectivo</span>
                <span className="text-white font-mono font-extrabold text-sm">{formatCurrency(salesReport.efectivo)}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Ingresos Manuales</span>
                <span className="text-brand-400 font-mono font-extrabold text-sm">+{formatCurrency(activeRegister.ingresos_manuales_efectivo || 0)}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Egresos (Gastos)</span>
                <span className="text-rose-400 font-mono font-extrabold text-sm">-{formatCurrency(activeRegister.egresos_manuales_efectivo || 0)}</span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
              <div>
                <span className="text-slate-400 text-xs font-bold block">Efectivo Neto Esperado:</span>
                <span className="text-[10px] text-slate-500">Apertura + Ventas + Ingresos - Egresos</span>
              </div>
              <span className="text-md font-mono-tech font-extrabold text-amber-400">
                {formatCurrency(
                  Number(activeRegister.monto_apertura) + 
                  salesReport.efectivo + 
                  Number(activeRegister.ingresos_manuales_efectivo || 0) - 
                  Number(activeRegister.egresos_manuales_efectivo || 0)
                )}
              </span>
            </div>

            <div className="border-t border-white/5 pt-3 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Ventas por Transferencia / Deuna:</span>
                <span className="font-mono text-white">{formatCurrency(salesReport.transferencia)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ventas por PayPhone:</span>
                <span className="font-mono text-white">{formatCurrency(salesReport.payphone)}</span>
              </div>
            </div>
          </div>

          {/* Formulario de Arqueo */}
          <form onSubmit={handleCloseShift} className="space-y-4">
            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">
                Efectivo Físico Contado en Caja ($)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  placeholder="0.00"
                  value={montoDeclarado}
                  onChange={(e) => setMontoDeclarado(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Cuenta físicamente todos los billetes y monedas en la gaveta y digita el total.
              </p>
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">
                Comentarios / Novedades del Turno
              </label>
              <textarea
                rows={2}
                placeholder="Ej: Faltó $1.00 por vuelto mal dado en mesa 3"
                value={comentariosArqueo}
                onChange={(e) => setComentariosArqueo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isClosingShift}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-display font-black text-xs tracking-wider uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-bold"
            >
              {isClosingShift ? 'Guardando Arqueo...' : 'Finalizar Turno & Cerrar Caja'}
            </button>
          </form>
        </div>
      </div>
    )}

    {/* Drawer de variantes de producto */}
    <ProductVariantsDrawer
      product={selectedProductForDrawer}
      onClose={() => setSelectedProductForDrawer(null)}
      onAddToCart={addToCartWithOptions}
      primaryColor="#10b981"
    />

    {/* Selector de Roles Simulador (Discreto en la esquina) */}
    <div className="fixed bottom-3 right-3 z-50 group">
      <details className="relative">
        <summary className="list-none cursor-pointer px-2.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/10 text-amber-400 hover:text-amber-300 text-[11px] font-mono-tech font-bold shadow-xl flex items-center gap-1.5 transition-all active:scale-95">
          <span>⚡</span>
          <span className="hidden sm:inline">Simulador</span>
          <span className="text-[10px] text-slate-400">({simulatedRole})</span>
        </summary>
        
        <div className="absolute bottom-full right-0 mb-2 p-2 rounded-2xl bg-[#0B0F1B]/95 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-1.5 w-48 animate-in fade-in zoom-in-95 duration-150">
          <span className="block text-[10px] font-mono-tech font-bold text-amber-400 px-2 py-0.5">
            Cambiar Rol Simulación:
          </span>
          {[
            { value: 'dueño', label: 'Dueño / Admin' },
            { value: 'cajero-1', label: 'Cajero 1 (Principal)' },
            { value: 'cajero-2', label: 'Cajero 2 (Barra)' },
            { value: 'cocinero', label: 'Cocinero (KDS)' }
          ].map((roleOpt) => (
            <button
              key={roleOpt.value}
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('kaltiro_simulated_role', roleOpt.value);
                  if (roleOpt.value === 'cocinero') {
                    window.location.href = `/${slug}/cocina`;
                  } else if (roleOpt.value.startsWith('cajero')) {
                    window.location.href = `/${slug}/caja`;
                  } else {
                    window.location.href = `/${slug}/admin/dashboard`;
                  }
                }
              }}
              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                simulatedRole === roleOpt.value
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {roleOpt.label}
            </button>
          ))}
        </div>
      </details>
    </div>
  </div>
  );
}
