'use client';

import React, { useState, useEffect, use, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Building2, Banknote, ShieldCheck, CheckCircle2, Upload, Sparkles, Copy, Check, Landmark, Truck, Store, Utensils, AlertCircle } from 'lucide-react';
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

// ─── Helpers de validación ──────────────────────────────────────────────────
const isValidEcPhone = (v: string) => /^(09|07|02|03|04|05|06|07|08)\d{8}$/.test(v.replace(/\s/g, ''));
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidCedula = (v: string) => /^\d{10}$/.test(v);
const isValidRuc = (v: string) => /^\d{13}$/.test(v);
const isValidPasaporte = (v: string) => v.trim().length >= 6;

type FormErrors = Record<string, string>;

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
  const [errors, setErrors] = useState<FormErrors>({});

  // Refs para scroll-to-error
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const setRef = (key: string) => (el: HTMLElement | null) => { fieldRefs.current[key] = el; };

  const clearError = (key: string) => setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });

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

  const handleUploadComprobante = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('comprobantes').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('comprobantes').getPublicUrl(path);
      setComprobanteUrl(data.publicUrl);
      toast.success('Comprobante subido correctamente');
    } catch (err: any) {
      toast.error('Error al subir comprobante: ' + (err.message ?? 'intenta de nuevo'));
    } finally {
      setIsUploading(false);
    }
  };

  // Helper para verificar UUID válido
  const isUuid = (str: string) =>
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

  // ─── Validación completa del formulario ─────────────────────────────────
  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};

    // Nombre
    if (!clienteNombre.trim()) {
      errs.nombre = 'El nombre es obligatorio.';
    } else if (clienteNombre.trim().length < 3) {
      errs.nombre = 'Mínimo 3 caracteres.';
    }

    // Teléfono ecuatoriano
    if (!clienteTelefono.trim()) {
      errs.telefono = 'El número de teléfono es obligatorio.';
    } else if (!isValidEcPhone(clienteTelefono)) {
      errs.telefono = 'Número ecuatoriano inválido (ej: 0991234567).';
    }

    // Dirección si es a domicilio
    if (tipoEntrega === 'domicilio') {
      if (!clienteDireccion.trim()) {
        errs.direccion = 'La dirección de entrega es obligatoria.';
      } else if (clienteDireccion.trim().length < 10) {
        errs.direccion = 'Ingresa una dirección más detallada.';
      }
    }

    // Mesa si tipo=mesa
    if (tipoEntrega === 'mesa' && !numeroMesa.trim()) {
      errs.mesa = 'Indica el número de mesa.';
    }

    // Comprobante si transferencia
    if (metodoPago === 'transferencia' && !comprobanteUrl) {
      errs.comprobante = 'Debes adjuntar el comprobante de transferencia.';
    }

    // Factura
    if (requiereFactura) {
      if (!datosFacturacion.num_doc.trim()) {
        errs.factura_num = 'El número de identificación es obligatorio.';
      } else {
        if (datosFacturacion.tipo_doc === 'CEDULA' && !isValidCedula(datosFacturacion.num_doc)) {
          errs.factura_num = 'La cédula debe tener exactamente 10 dígitos.';
        } else if (datosFacturacion.tipo_doc === 'RUC' && !isValidRuc(datosFacturacion.num_doc)) {
          errs.factura_num = 'El RUC debe tener exactamente 13 dígitos.';
        } else if (datosFacturacion.tipo_doc === 'PASAPORTE' && !isValidPasaporte(datosFacturacion.num_doc)) {
          errs.factura_num = 'El pasaporte debe tener al menos 6 caracteres.';
        }
      }
      if (!datosFacturacion.razon_social.trim()) {
        errs.factura_razon = 'La razón social / nombre completo es obligatorio.';
      }
      if (!datosFacturacion.email.trim()) {
        errs.factura_email = 'El correo electrónico es obligatorio.';
      } else if (!isValidEmail(datosFacturacion.email)) {
        errs.factura_email = 'Correo electrónico inválido.';
      }
    }

    return errs;
  }, [clienteNombre, clienteTelefono, tipoEntrega, clienteDireccion, numeroMesa, metodoPago, comprobanteUrl, requiereFactura, datosFacturacion]);

  // Enviar Pedido a Supabase Real / Fallback Local
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll al primer campo con error
      const firstKey = Object.keys(errs)[0];
      const el = fieldRefs.current[firstKey];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setErrors({});

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

        // Construir array de items para el RPC
        const rpcItems = items.map((item) => ({
          product_id: isUuid(item.product.id) ? item.product.id : null,
          nombre_producto: item.product.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.product.en_oferta && item.product.precio_oferta
            ? item.product.precio_oferta
            : item.product.precio,
          notas: item.notas || null,
          opciones_seleccionadas: item.opciones_seleccionadas ?? null,
        }));

        // RPC atómico: número secuencial + orden + items en una transacción
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_order_atomic', {
          p_business_id:       business.id,
          p_cliente_nombre:    clienteNombre,
          p_cliente_telefono:  clienteTelefono,
          p_cliente_direccion: clienteDireccion || '',
          p_tipo_entrega:      tipoEntrega,
          p_numero_mesa:       numeroMesa || '',
          p_costo_envio:       costoEnvio,
          p_subtotal:          subtotal,
          p_total:             total,
          p_metodo_pago:       metodoPago,
          p_estado_pago:       'pendiente',
          p_comprobante_url:   comprobanteUrl || '',
          p_payphone_tx_id:    '',
          p_requiere_factura:  requiereFactura,
          p_datos_facturacion: requiereFactura ? datosFacturacion : null,
          p_items:             rpcItems,
        });

        if (rpcError) {
          const errMsg = rpcError.message || rpcError.details || JSON.stringify(rpcError);
          console.error('Error en create_order_atomic:', errMsg);
          toast.error(`No se pudo registrar el pedido. Intenta de nuevo.`);
          setIsSubmitting(false);
          return;
        }

        createdOrderId = (rpcData as any).id;

        // Broadcast Realtime para notificar a Caja / Cocina
        try {
          const channelName = `kaltiro-orders-${business.id}`;
          const rtChannel = supabase.channel(channelName);
          await new Promise<void>((resolve) => {
            rtChannel.subscribe(async (status: string) => {
              if (status === 'SUBSCRIBED') {
                await rtChannel.send({
                  type: 'broadcast',
                  event: 'NEW_ORDER',
                  payload: {
                    id: createdOrderId,
                    numero_pedido: (rpcData as any).numero_pedido,
                    business_id: business.id,
                    cliente_nombre: clienteNombre,
                    total,
                    tipo_entrega: tipoEntrega,
                    numero_mesa: numeroMesa || null,
                    items: rpcItems,
                  },
                });
                setTimeout(() => supabase.removeChannel(rtChannel), 300);
                resolve();
              }
            });
            setTimeout(resolve, 800);
          });
        } catch (e) {
          console.log('Error emitiendo broadcast Supabase:', e);
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
              <div ref={setRef('nombre') as any}>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={clienteNombre}
                  onChange={(e) => { setClienteNombre(e.target.value); clearError('nombre'); }}
                  className={`w-full px-4 py-3 rounded-2xl bg-slate-950/80 border text-sm text-white focus:outline-none transition-colors ${
                    errors.nombre ? 'border-rose-500 focus:border-rose-400 bg-rose-500/5' : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
                {errors.nombre && (
                  <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.nombre}
                  </p>
                )}
              </div>

              <div ref={setRef('telefono') as any}>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">WhatsApp / Celular *</label>
                <input
                  type="tel"
                  placeholder="Ej: 0991234567"
                  value={clienteTelefono}
                  onChange={(e) => { setClienteTelefono(e.target.value); clearError('telefono'); }}
                  className={`w-full px-4 py-3 rounded-2xl bg-slate-950/80 border text-sm text-white focus:outline-none transition-colors font-mono-tech ${
                    errors.telefono ? 'border-rose-500 focus:border-rose-400 bg-rose-500/5' : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
                {errors.telefono && (
                  <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.telefono}
                  </p>
                )}
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
                className={`p-3.5 rounded-2xl border text-xs font-display font-bold text-center flex items-center justify-center gap-2 transition-all ${
                  tipoEntrega === 'domicilio'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Domicilio</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoEntrega('retiro_local')}
                className={`p-3.5 rounded-2xl border text-xs font-display font-bold text-center flex items-center justify-center gap-2 transition-all ${
                  tipoEntrega === 'retiro_local'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Retiro Local</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoEntrega('mesa')}
                className={`p-3.5 rounded-2xl border text-xs font-display font-bold text-center flex items-center justify-center gap-2 transition-all ${
                  tipoEntrega === 'mesa'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>En Mesa</span>
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

                <div ref={setRef('direccion') as any}>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Dirección Exacta y Referencia *</label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Calle Larga 4-12 y Vargas Machuca, junto a la panadería."
                    value={clienteDireccion}
                    onChange={(e) => { setClienteDireccion(e.target.value); clearError('direccion'); }}
                    className={`w-full px-4 py-3 rounded-2xl bg-slate-950 border text-sm text-white focus:outline-none transition-colors ${
                      errors.direccion ? 'border-rose-500 focus:border-rose-400 bg-rose-500/5' : 'border-slate-800 focus:border-amber-500'
                    }`}
                  />
                  {errors.direccion && (
                    <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.direccion}
                    </p>
                  )}
                </div>
              </div>
            )}

            {tipoEntrega === 'mesa' && (
              <div ref={setRef('mesa') as any}>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Número de Mesa *</label>
                <input
                  type="text"
                  placeholder="Ej: Mesa 4"
                  value={numeroMesa}
                  onChange={(e) => { setNumeroMesa(e.target.value); clearError('mesa'); }}
                  className={`w-full px-4 py-3 rounded-2xl bg-slate-950 border text-sm text-white focus:outline-none transition-colors ${
                    errors.mesa ? 'border-rose-500 focus:border-rose-400 bg-rose-500/5' : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
                {errors.mesa && (
                  <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.mesa}
                  </p>
                )}
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

                  <div className="sm:col-span-2" ref={setRef('factura_num') as any}>
                    <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Nro. Identificación *</label>
                    <input
                      type="text"
                      placeholder="0102938475001"
                      value={datosFacturacion.num_doc}
                      onChange={(e) => { setDatosFacturacion({ ...datosFacturacion, num_doc: e.target.value }); clearError('factura_num'); }}
                      className={`w-full px-3.5 py-3 rounded-2xl bg-slate-950 border text-xs text-white font-mono-tech transition-colors ${
                        errors.factura_num ? 'border-rose-500 bg-rose-500/5' : 'border-slate-800'
                      }`}
                    />
                    {errors.factura_num && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.factura_num}
                      </p>
                    )}
                  </div>
                </div>

                <div ref={setRef('factura_razon') as any}>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Nombre para la factura *</label>
                  <input
                    type="text"
                    placeholder="Ej: Comercializadora Cuenca S.A."
                    value={datosFacturacion.razon_social}
                    onChange={(e) => { setDatosFacturacion({ ...datosFacturacion, razon_social: e.target.value }); clearError('factura_razon'); }}
                    className={`w-full px-3.5 py-3 rounded-2xl bg-slate-950 border text-xs text-white transition-colors ${
                      errors.factura_razon ? 'border-rose-500 bg-rose-500/5' : 'border-slate-800'
                    }`}
                  />
                  {errors.factura_razon && (
                    <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.factura_razon}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div ref={setRef('factura_email') as any}>
                    <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      placeholder="facturas@empresa.com"
                      value={datosFacturacion.email}
                      onChange={(e) => { setDatosFacturacion({ ...datosFacturacion, email: e.target.value }); clearError('factura_email'); }}
                      className={`w-full px-3.5 py-3 rounded-2xl bg-slate-950 border text-xs text-white transition-colors ${
                        errors.factura_email ? 'border-rose-500 bg-rose-500/5' : 'border-slate-800'
                      }`}
                    />
                    {errors.factura_email && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.factura_email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Dirección</label>
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
              ¿Cómo vas a pagar?
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
                                    <Check className="w-3 h-3 text-brand-400" />
                                    <span className="text-brand-400">Copiado</span>
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

                  <div className="pt-2 border-t border-slate-800" ref={setRef('comprobante') as any}>
                    <label className="block text-xs font-display font-bold text-amber-400 mb-1.5 flex items-center justify-between">
                      <span>Adjuntar Comprobante de Transferencia</span>
                      <span className="text-[10px] text-rose-400 font-mono-tech font-bold uppercase">* Obligatorio</span>
                    </label>
                    {comprobanteUrl ? (
                      <div className="flex items-center gap-2 text-xs text-brand-400 bg-brand-500/10 p-2.5 rounded-xl border border-brand-500/30">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Comprobante adjuntado correctamente.</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-dashed text-xs cursor-pointer transition-colors ${
                          errors.comprobante
                            ? 'border-rose-500 bg-rose-500/10 text-rose-300 hover:border-rose-400'
                            : 'border-amber-500/50 bg-amber-500/5 text-amber-300 hover:text-white hover:border-amber-400'
                        }`}>
                          <Upload className="w-4 h-4" />
                          <span>{isUploading ? 'Subiendo...' : 'Seleccionar foto / PDF del comprobante *'}</span>
                          <input type="file" accept="image/*,application/pdf" onChange={(e) => { handleUploadComprobante(e); clearError('comprobante'); }} className="hidden" />
                        </label>
                        {errors.comprobante ? (
                          <p className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.comprobante}
                          </p>
                        ) : (
                          <p className="text-[10px] text-rose-400 font-medium">
                            * Debes adjuntar la foto del comprobante bancario para poder procesar la orden.
                          </p>
                        )}
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
                <span>Subtotal ({items.length} {items.length === 1 ? 'producto' : 'productos'}):</span>
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
