'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Building2, Banknote, ShieldCheck, CheckCircle2, Upload, Sparkles, Copy, Check, Landmark } from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { MOCK_BUSINESS } from '@/lib/supabase/mock-data';
import { useCart } from '@/hooks/useCart';
import { useCustomerOrders } from '@/hooks/useCustomerOrders';
import { formatCurrency } from '@/lib/utils/currency';
import { DeliveryType, PaymentMethod, BillingData, BankDetails, Business, ShippingZone } from '@/lib/types/database';
import { createClient } from '@/lib/supabase/client';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomCheckbox } from '@/components/ui/CustomCheckbox';
import confetti from 'canvas-confetti';

export default function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();

  const [business, setBusiness] = useState<Business>(MOCK_BUSINESS);
  const { items, subtotal, clearCart } = useCart(slug);
  const { profile, saveCustomerProfile, addOrderIdToHistory } = useCustomerOrders(slug);

  // Form State
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState<DeliveryType>('domicilio');
  const [selectedZonaId, setSelectedZonaId] = useState<string>(MOCK_BUSINESS.zonas_envio[0]?.id || '');
  const [numeroMesa, setNumeroMesa] = useState('');
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>('payphone');
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedAccNumber, setCopiedAccNumber] = useState<string | null>(null);

  // Cargar Negocio Real desde Supabase por slug
  useEffect(() => {
    async function loadBusinessData() {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from('businesses')
            .select('*')
            .eq('slug', slug)
            .single();

          if (data) {
            setBusiness(data as Business);
            if (!data.has_payphone && metodoPago === 'payphone') {
              setMetodoPago('transferencia');
            }
            if (data.zonas_envio && data.zonas_envio.length > 0) {
              setSelectedZonaId(data.zonas_envio[0].id);
            }
          }
        } catch (err) {
          console.error('Error cargando negocio en checkout:', err);
        }
      }
    }
    loadBusinessData();
  }, [slug]);

  // Facturación State (Ecuador)
  const [requiereFactura, setRequiereFactura] = useState(false);
  const [datosFacturacion, setDatosFacturacion] = useState<BillingData>({
    tipo_doc: 'CEDULA',
    num_doc: '',
    razon_social: '',
    email: '',
    direccion: '',
  });

  // Auto-completado seguro si existe perfil local guardado
  useEffect(() => {
    if (profile) {
      if (profile.nombre) setClienteNombre(profile.nombre);
      if (profile.telefono) setClienteTelefono(profile.telefono);
      if (profile.direccion) setClienteDireccion(profile.direccion);
      if (profile.requiereFactura) setRequiereFactura(profile.requiereFactura);
      if (profile.rucCi) setDatosFacturacion((prev) => ({ ...prev, num_doc: profile.rucCi }));
      if (profile.razonSocial) setDatosFacturacion((prev) => ({ ...prev, razon_social: profile.razonSocial }));
      if (profile.email) setDatosFacturacion((prev) => ({ ...prev, email: profile.email }));
    }
  }, [profile]);

  const selectedZona = business.zonas_envio?.find((z: ShippingZone) => z.id === selectedZonaId);
  const costoEnvio = tipoEntrega === 'domicilio' ? selectedZona?.costo || 1.50 : 0;
  const total = subtotal + costoEnvio;

  const handleUploadSimulated = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      setTimeout(() => {
        setComprobanteUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&q=80');
        setIsUploading(false);
      }, 800);
    }
  };

  // Helper para verificar UUID válido
  const isUuid = (str: string) =>
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

  // Enviar Pedido a Supabase Real / Fallback Local
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteNombre || !clienteTelefono) {
      alert('Por favor completa tu nombre y número de teléfono.');
      return;
    }

    if (tipoEntrega === 'domicilio' && !clienteDireccion) {
      alert('Por favor ingresa tu dirección de entrega en Cuenca.');
      return;
    }

    if (metodoPago === 'transferencia' && !comprobanteUrl) {
      toast.error('Es obligatorio adjuntar la foto o comprobante de la transferencia para confirmar el pedido.');
      return;
    }

    if (requiereFactura && (!datosFacturacion.num_doc || !datosFacturacion.razon_social || !datosFacturacion.email)) {
      alert('Por favor completa los datos obligatorios para la factura (Cédula/RUC, Razón Social y Email).');
      return;
    }

    setIsSubmitting(true);

    saveCustomerProfile({
      nombre: clienteNombre,
      telefono: clienteTelefono,
      direccion: clienteDireccion,
      requiereFactura: requiereFactura,
      rucCi: datosFacturacion.num_doc,
      razonSocial: datosFacturacion.razon_social,
      email: datosFacturacion.email,
    });

    let createdOrderId = `ord-${Date.now()}`;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      try {
        const supabase = createClient();
        
        const randomOrderNum = Math.floor(Math.random() * 899) + 100;
        
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            business_id: business.id,
            numero_pedido: randomOrderNum,
            cliente_nombre: clienteNombre,
            cliente_telefono: clienteTelefono,
            cliente_direccion: clienteDireccion || null,
            tipo_entrega: tipoEntrega,
            numero_mesa: numeroMesa || null,
            costo_envio: costoEnvio,
            subtotal: subtotal,
            total: total,
            metodo_pago: metodoPago,
            estado_pago: metodoPago === 'payphone' ? 'pagado' : 'pendiente',
            comprobante_pago_url: comprobanteUrl,
            payphone_transaction_id: metodoPago === 'payphone' ? `PYP-${Math.floor(Math.random() * 899999 + 100000)}` : null,
            requiere_factura: requiereFactura,
            datos_facturacion: requiereFactura ? datosFacturacion : null,
            estado: 'pendiente',
          })
          .select()
          .single();

        if (orderError) {
          const errMsg = orderError.message || orderError.details || JSON.stringify(orderError);
          console.error('Error guardando en Supabase:', errMsg);
          toast.error(`Aviso: Se registró pedido local. (${errMsg})`);
        } else if (orderData) {
          createdOrderId = orderData.id;

          const orderItemsToInsert = items.map((item) => ({
            order_id: orderData.id,
            product_id: isUuid(item.product.id) ? item.product.id : null,
            cantidad: item.cantidad,
            precio_unitario: item.product.precio_oferta && item.product.en_oferta ? item.product.precio_oferta : item.product.precio,
            notas: item.notas || null,
          }));

          const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsToInsert);
          if (itemsErr) {
            console.error('Error guardando order_items:', itemsErr.message || itemsErr.details);
          }

          // Emitir evento Supabase Realtime Broadcast para notificación instantánea en cualquier navegador
          try {
            const channelName = `yapi-orders-${business.id}`;
            const rtChannel = supabase.channel(channelName);
            await new Promise<void>((resolve) => {
              rtChannel.subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                  const fullOrderPayload = {
                    ...orderData,
                    items: orderItemsToInsert.map((item) => {
                      const cartMatch = items.find((c: any) => c.product.id === item.product_id);
                      return {
                        ...item,
                        product: cartMatch ? cartMatch.product : null,
                      };
                    }),
                  };
                  await rtChannel.send({
                    type: 'broadcast',
                    event: 'NEW_ORDER',
                    payload: fullOrderPayload,
                  });
                  setTimeout(() => {
                    supabase.removeChannel(rtChannel);
                  }, 300);
                  resolve();
                }
              });
              setTimeout(resolve, 800);
            });
          } catch (e) {
            console.log('Error emitiendo broadcast Supabase:', e);
          }
        }
      } catch (err: any) {
        console.error('Excepción al conectar con Supabase:', err?.message || err);
      }
    }

    addOrderIdToHistory(createdOrderId);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    clearCart();

    setTimeout(() => {
      setIsSubmitting(false);
      router.push(`/${slug}/pedido/${createdOrderId}`);
    }, 600);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#070A11] text-white flex flex-col items-center justify-center p-4">
        <p className="text-slate-400 mb-4 font-display">No tienes productos en tu carrito.</p>
        <Link
          href={`/${slug}`}
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-display font-bold text-sm"
        >
          Volver al Catálogo
        </Link>
      </div>
    );
  }

  const zonaOptions = (business.zonas_envio || []).map((z: ShippingZone) => ({
    value: z.id,
    label: `${z.zona} (${formatCurrency(z.costo)})`,
  }));

  const docOptions = [
    { value: 'CEDULA', label: 'Cédula de Identidad (10 dígitos)' },
    { value: 'RUC', label: 'RUC de Empresa (13 dígitos)' },
    { value: 'PASAPORTE', label: 'Pasaporte Extranjero' },
  ];

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 font-sans pb-16 relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-panel border-b border-white/10 px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href={`/${slug}`}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Link>
          <h1 className="font-display font-extrabold text-sm text-white">Finalizar Pedido</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6 relative z-10">
        {profile && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>¡Bienvenido de vuelta! Auto-completamos tus datos de envío guardados en este dispositivo.</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="space-y-6">
          {/* 1. Datos del Cliente */}
          <div className="glass-card p-5 md:p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
            <h2 className="font-display font-black text-base text-white flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-mono-tech border border-amber-500/30">1</span>
              Tus Datos de Contacto
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">WhatsApp / Celular *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 0991234567"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500 font-mono-tech"
                />
              </div>
            </div>
          </div>

          {/* 2. Tipo de Entrega */}
          <div className="glass-card p-5 md:p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
            <h2 className="font-display font-black text-base text-white flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-mono-tech border border-amber-500/30">2</span>
              Método de Entrega
            </h2>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTipoEntrega('domicilio')}
                className={`p-3.5 rounded-2xl border text-xs font-display font-bold text-center transition-all ${
                  tipoEntrega === 'domicilio'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🚚 Domicilio
              </button>
              <button
                type="button"
                onClick={() => setTipoEntrega('retiro_local')}
                className={`p-3.5 rounded-2xl border text-xs font-display font-bold text-center transition-all ${
                  tipoEntrega === 'retiro_local'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🏪 Retiro Local
              </button>
              <button
                type="button"
                onClick={() => setTipoEntrega('mesa')}
                className={`p-3.5 rounded-2xl border text-xs font-display font-bold text-center transition-all ${
                  tipoEntrega === 'mesa'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🪟 En Mesa
              </button>
            </div>

            {tipoEntrega === 'domicilio' && (
              <div className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Zona de Envío en Cuenca</label>
                  <CustomSelect
                    options={zonaOptions}
                    value={selectedZonaId}
                    onChange={(val) => setSelectedZonaId(val)}
                    accentColor="amber"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Dirección Exacta y Referencia *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Ej: Calle Larga 4-12 y Vargas Machuca, junto a la panadería."
                    value={clienteDireccion}
                    onChange={(e) => setClienteDireccion(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {tipoEntrega === 'mesa' && (
              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Número de Mesa</label>
                <input
                  type="text"
                  placeholder="Ej: Mesa 4"
                  value={numeroMesa}
                  onChange={(e) => setNumeroMesa(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* 3. Datos de Facturación ECUADOR */}
          <div className="glass-card p-5 md:p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
            <h2 className="font-display font-black text-base text-white flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-mono-tech border border-amber-500/30">3</span>
              Datos de Facturación (Ecuador)
            </h2>

            <CustomCheckbox
              checked={requiereFactura}
              onChange={setRequiereFactura}
              label="¿Requieres Factura con Datos (RUC / Cédula)?"
              description="Genera tu comprobante electrónico de venta válido en Ecuador"
              accentColor="amber"
            />

            {requiereFactura && (
              <div className="space-y-3.5 pt-3 border-t border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Tipo Doc.</label>
                    <CustomSelect
                      options={docOptions}
                      value={datosFacturacion.tipo_doc}
                      onChange={(val) => setDatosFacturacion({ ...datosFacturacion, tipo_doc: val as any })}
                      accentColor="amber"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Nro. Identificación *</label>
                    <input
                      type="text"
                      required
                      placeholder="0102938475001"
                      value={datosFacturacion.num_doc}
                      onChange={(e) => setDatosFacturacion({ ...datosFacturacion, num_doc: e.target.value })}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-mono-tech"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Razón Social / Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Comercializadora Cuenca S.A."
                    value={datosFacturacion.razon_social}
                    onChange={(e) => setDatosFacturacion({ ...datosFacturacion, razon_social: e.target.value })}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      placeholder="facturas@empresa.com"
                      value={datosFacturacion.email}
                      onChange={(e) => setDatosFacturacion({ ...datosFacturacion, email: e.target.value })}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Dirección Fiscal</label>
                    <input
                      type="text"
                      placeholder="Cuenca, Ecuador"
                      value={datosFacturacion.direccion}
                      onChange={(e) => setDatosFacturacion({ ...datosFacturacion, direccion: e.target.value })}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Método de Pago (PayPhone / Transferencia / Efectivo) */}
          <div className="glass-card p-5 md:p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
            <h2 className="font-display font-black text-base text-white flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-mono-tech border border-amber-500/30">4</span>
              Método de Pago
            </h2>

            <div className="space-y-2">
              {business.configuracion_operativa?.acepta_payphone !== false && business.has_payphone && (
                <label
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    metodoPago === 'payphone'
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="pago"
                      checked={metodoPago === 'payphone'}
                      onChange={() => setMetodoPago('payphone')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-display font-bold text-sm flex items-center gap-2 text-white">
                        <CreditCard className="w-4 h-4 text-amber-400" /> PayPhone (Tarjeta Crédito / Débito / App)
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">Pago seguro con Visa, Mastercard o App PayPhone.</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-mono-tech font-bold border border-orange-500/30">ECUADOR</span>
                </label>
              )}

              {business.configuracion_operativa?.acepta_transferencia !== false && (
                <label
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    metodoPago === 'transferencia'
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="pago"
                      checked={metodoPago === 'transferencia'}
                      onChange={() => setMetodoPago('transferencia')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-display font-bold text-sm flex items-center gap-2 text-white">
                        <Building2 className="w-4 h-4 text-amber-400" /> Transferencia Bancaria Directa
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">Banco Pichincha, Banco Guayaquil, JEP y más con comprobante adjunto.</p>
                    </div>
                  </div>
                </label>
              )}

              {business.configuracion_operativa?.acepta_efectivo !== false && (
                <label
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    metodoPago === 'efectivo'
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="pago"
                      checked={metodoPago === 'efectivo'}
                      onChange={() => setMetodoPago('efectivo')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-display font-bold text-sm flex items-center gap-2 text-white">
                        <Banknote className="w-4 h-4 text-amber-400" /> Efectivo / Pago Contra Entrega
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">Entregas el valor directo al repartidor.</p>
                    </div>
                  </div>
                </label>
              )}
            </div>

            {metodoPago === 'transferencia' && (() => {
              const bankAccountsList: BankDetails[] = business.cuentas_bancarias || business.configuracion_operativa?.cuentas_bancarias || [business.datos_bancarios];
              return (
                <div className="p-4.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div>
                    <h4 className="font-display font-bold text-amber-400 text-sm flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Landmark className="w-4 h-4 text-amber-400" /> Cuentas Bancarias Habilitadas:
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {bankAccountsList.length} {bankAccountsList.length === 1 ? 'opción' : 'opciones'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Realiza tu transferencia a cualquiera de estas cuentas y adjunta tu comprobante:
                    </p>
                  </div>

                  <div className="space-y-3">
                    {bankAccountsList.map((acc, index) => (
                      <div
                        key={acc.id || index}
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-amber-500/40 transition-colors"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <span className="font-display font-bold text-xs text-white flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-amber-400" />
                            {acc.banco}
                          </span>
                          <span className="text-[10px] font-mono font-medium text-slate-300 px-2 py-0.5 bg-slate-800/80 rounded-md border border-slate-700/50">
                            {acc.tipo_cuenta}
                          </span>
                        </div>

                        <div className="text-xs space-y-1 text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Nro. Cuenta:</span>
                            <div className="flex items-center gap-2">
                              <strong className="text-white font-mono-tech tracking-wider">{acc.numero_cuenta}</strong>
                              <button
                                type="button"
                                onClick={() => {
                                  if (typeof window !== 'undefined' && navigator.clipboard) {
                                    navigator.clipboard.writeText(acc.numero_cuenta);
                                  }
                                  setCopiedAccNumber(acc.numero_cuenta);
                                  toast.success(`Número de cuenta ${acc.banco} copiado`);
                                  setTimeout(() => setCopiedAccNumber(null), 2000);
                                }}
                                className="px-2 py-0.5 text-slate-300 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-md transition-colors text-[10px] flex items-center gap-1 font-sans"
                                title="Copiar número de cuenta"
                              >
                                {copiedAccNumber === acc.numero_cuenta ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copiado</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-400">Titular:</span>
                            <span className="text-white font-medium">{acc.titular}</span>
                          </div>

                          {acc.ruc_ci && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">RUC / Cédula:</span>
                              <span className="font-mono text-slate-300">{acc.ruc_ci}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-xs font-display font-bold text-amber-400 mb-1.5 flex items-center justify-between">
                      <span>Adjuntar Comprobante de Transferencia</span>
                      <span className="text-[10px] text-rose-400 font-mono-tech font-bold uppercase">* Obligatorio</span>
                    </label>
                    {comprobanteUrl ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Comprobante adjuntado correctamente.</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-dashed border-amber-500/50 bg-amber-500/5 text-xs text-amber-300 hover:text-white hover:border-amber-400 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-amber-400" />
                          <span>{isUploading ? 'Subiendo imagen...' : 'Seleccionar foto de comprobante *'}</span>
                          <input type="file" accept="image/*" onChange={handleUploadSimulated} className="hidden" />
                        </label>
                        <p className="text-[10px] text-rose-400 font-medium">
                          * Debes adjuntar la foto del comprobante bancario para poder procesar la orden.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Resumen Final de Compra */}
          <div className="glass-card p-5 md:p-6 rounded-3xl border border-white/10 space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-sm text-white">Resumen del Pedido</h3>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal ({items.length} ítems):</span>
                <span className="font-mono-tech">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Costo de Envío:</span>
                <span className="font-mono-tech">{costoEnvio > 0 ? formatCurrency(costoEnvio) : 'GRATIS'}</span>
              </div>
              <div className="flex justify-between text-sm font-display font-bold text-amber-400 pt-2 border-t border-white/10">
                <span>TOTAL FINAL:</span>
                <span className="text-lg font-mono-tech">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-display font-black text-base shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all border border-amber-400/40 disabled:opacity-50"
            >
              <ShieldCheck className="w-5 h-5 text-slate-950" />
              <span>{isSubmitting ? 'Guardando en Supabase...' : `Confirmar Pedido (${formatCurrency(total)})`}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
