'use client';

import React, { use, useState, useEffect, useRef } from 'react';
import {
  Settings, Save, Building2, CreditCard, Clock, RefreshCw, QrCode, Banknote,
  Landmark, Smartphone, Plus, Trash2, Eye, EyeOff,
  KeyRound, Upload, ShieldCheck, AlertCircle, CheckCircle2, FlaskConical,
  Globe, Loader2, Info, Hash,
} from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { createClient } from '@/lib/supabase/client';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomCheckbox } from '@/components/ui/CustomCheckbox';
import type { BankDetails, BusinessSriConfig } from '@/lib/types/database';

const prepTimeOptions = [
  { value: '10 - 15 min', label: '10 - 15 min (Express / Comida Rápida)' },
  { value: '15 - 25 min', label: '15 - 25 min (Estándar / Cafetería & Bistro)' },
  { value: '25 - 40 min', label: '25 - 40 min (Platos Fuertes / Gourmet)' },
  { value: '40 - 60 min', label: '40 - 60 min (Especialidades / Horneados)' },
  { value: 'Inmediato / Listo', label: 'Inmediato / Listo (Empaquetados)' },
];

const ECUADOR_BANKS = [
  'Banco Pichincha', 'Banco Guayaquil', 'Produbanco', 'Banco del Pacífico',
  'Banco del Austro', 'Banco Internacional', 'Banco Bolivariano', 'Banco de Loja',
  'Banco Machala', 'Banco Solidario', 'Banco D-MIRO', 'Banco ProCredit', 'Citibank Ecuador',
  'Cooperativa JEP', 'Cooperativa Jardín Azuayo', 'Cooperativa Policía Nacional (CPN)',
  'Cooperativa Alianza del Valle', 'Cooperativa 29 de Octubre', 'Cooperativa Atuntaqui',
  'Cooperativa San Francisco', 'Cooperativa Oscus', 'Cooperativa Cacpeco',
  'Cooperativa Comercio', 'Cooperativa Andalucía', 'Cooperativa CoopNacional',
  'Cooperativa CACPE Loja', 'Cooperativa Padre Julián Lorente',
  'Mutualista Pichincha', 'Mutualista Azuay', 'BanEcuador B.P.',
  'BIESS (Banco del IESS)', 'Otro / Institución Financiera',
];

type Tab = 'negocio' | 'pagos' | 'sri';

export default function AdminSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { business, loading } = useAdminBusiness(slug);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('negocio');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('kaltiro_simulated_role') || 'dueño';
      if (role !== 'dueño') {
        toast.error('Acceso denegado: solo el Administrador (Dueño) puede gestionar la configuración.');
        const _s = JSON.parse(localStorage.getItem('kaltiro_admin_session') || '{}');
        window.location.href = `/${_s?.business?.slug || ''}/caja`;
      } else {
        setAuthorized(true);
      }
    }
  }, []);

  // ── TAB: NEGOCIO ──────────────────────────────────────────────────
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');
  const [direccion, setDireccion] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [tiempoPreparacion, setTiempoPreparacion] = useState('15 - 25 min');
  const [permiteDomicilio, setPermiteDomicilio] = useState(true);
  const [permiteRetiro, setPermiteRetiro] = useState(true);
  const [tipoServicioMesa, setTipoServicioMesa] = useState<'mesero' | 'barra'>('mesero');
  const [horarioActivo, setHorarioActivo] = useState(false);
  const [horarioApertura, setHorarioApertura] = useState('08:00');
  const [horarioCierre, setHorarioCierre] = useState('22:00');

  // ── TAB: PAGOS ────────────────────────────────────────────────────
  const [aceptaDeuna, setAceptaDeuna] = useState(true);
  const [deunaNumero, setDeunaNumero] = useState('');
  const [deunaTitular, setDeunaTitular] = useState('');
  const [aceptaTransferencia, setAceptaTransferencia] = useState(true);
  const [cuentasBancarias, setCuentasBancarias] = useState<BankDetails[]>([]);
  const [aceptaPayphone, setAceptaPayphone] = useState(true);
  const [payphoneToken, setPayphoneToken] = useState('');
  const [showPayphoneToken, setShowPayphoneToken] = useState(false);
  const [aceptaEfectivo, setAceptaEfectivo] = useState(true);
  const [instruccionesEfectivo, setInstruccionesEfectivo] = useState('Pago en efectivo directamente al entregar el pedido o en caja.');

  // ── TAB: SRI ──────────────────────────────────────────────────────
  const [sriConfig, setSriConfig] = useState<BusinessSriConfig | null>(null);
  const [loadingSri, setLoadingSri] = useState(true);
  const [savingSri, setSavingSri] = useState(false);
  const [showClave, setShowClave] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [certFileName, setCertFileName] = useState('');
  const [certLoaded, setCertLoaded] = useState(false);
  const [sriForm, setSriForm] = useState({
    ruc_emisor: '',
    razon_social: '',
    nombre_comercial: '',
    direccion_matriz: '',
    codigo_establecimiento: '001',
    codigo_punto_emision: '001',
    ambiente: 'pruebas' as 'pruebas' | 'produccion',
    certificado_p12_base64: '',
    certificado_clave: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load business settings
  useEffect(() => {
    if (business) {
      setNombre(business.nombre);
      setRuc(business.ruc || '');
      setTelefonoWhatsapp(business.telefono_whatsapp || '');
      setDireccion(business.direccion || '');
      setGoogleMapsUrl(business.configuracion_operativa?.google_maps_url || business.google_maps_url || '');
      setPayphoneToken(business.payphone_token || '');

      const cuentas = business.cuentas_bancarias || business.configuracion_operativa?.cuentas_bancarias;
      if (cuentas && cuentas.length > 0) {
        setCuentasBancarias(cuentas);
      } else if (business.datos_bancarios && business.datos_bancarios.banco) {
        setCuentasBancarias([{
          id: 'bank-1',
          banco: business.datos_bancarios.banco || 'Banco Pichincha',
          tipo_cuenta: business.datos_bancarios.tipo_cuenta || 'Ahorros',
          numero_cuenta: business.datos_bancarios.numero_cuenta || '',
          titular: business.datos_bancarios.titular || business.nombre,
          ruc_ci: business.datos_bancarios.ruc_ci || business.ruc || '',
          activa: true,
        }]);
      } else {
        setCuentasBancarias([{
          id: 'bank-1', banco: 'Banco Pichincha', tipo_cuenta: 'Ahorros',
          numero_cuenta: '', titular: business.nombre, ruc_ci: business.ruc || '', activa: true,
        }]);
      }

      if (business.configuracion_operativa) {
        const op = business.configuracion_operativa;
        if (op.tiempo_preparacion) setTiempoPreparacion(op.tiempo_preparacion);
        if (op.permite_domicilio !== undefined) setPermiteDomicilio(op.permite_domicilio);
        if (op.permite_retiro !== undefined) setPermiteRetiro(op.permite_retiro);
        if (op.tipo_servicio_mesa) setTipoServicioMesa(op.tipo_servicio_mesa);
        if (op.acepta_deuna !== undefined) setAceptaDeuna(op.acepta_deuna);
        if (op.deuna_numero) setDeunaNumero(op.deuna_numero);
        if (op.deuna_titular) setDeunaTitular(op.deuna_titular);
        if (op.acepta_transferencia !== undefined) setAceptaTransferencia(op.acepta_transferencia);
        if (op.acepta_payphone !== undefined) setAceptaPayphone(op.acepta_payphone);
        if (op.acepta_efectivo !== undefined) setAceptaEfectivo(op.acepta_efectivo);
        if (op.instrucciones_efectivo) setInstruccionesEfectivo(op.instrucciones_efectivo);
        if (op.horario_activo !== undefined) setHorarioActivo(op.horario_activo);
        if (op.horario_apertura) setHorarioApertura(op.horario_apertura);
        if (op.horario_cierre) setHorarioCierre(op.horario_cierre);
      }
    }
  }, [business]);

  // Load SRI config
  useEffect(() => {
    async function loadSri() {
      if (!business || !business.has_facturacion_sri) { setLoadingSri(false); return; }
      setLoadingSri(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('business_sri_config')
          .select('*')
          .eq('business_id', business.id)
          .maybeSingle();

        if (data) {
          setSriConfig(data as BusinessSriConfig);
          setSriForm(prev => ({
            ...prev,
            ruc_emisor: data.ruc_emisor ?? '',
            razon_social: data.razon_social ?? '',
            nombre_comercial: data.nombre_comercial ?? '',
            direccion_matriz: data.direccion_matriz ?? '',
            codigo_establecimiento: data.codigo_establecimiento ?? '001',
            codigo_punto_emision: data.codigo_punto_emision ?? '001',
            ambiente: data.ambiente ?? 'pruebas',
            certificado_p12_base64: '',
            certificado_clave: '',
          }));
          if (data.certificado_p12_base64) {
            setCertLoaded(true);
            setCertFileName('Certificado cargado');
          }
        } else {
          setSriForm(prev => ({
            ...prev,
            ruc_emisor: business.ruc ?? '',
            razon_social: business.nombre ?? '',
            nombre_comercial: business.nombre ?? '',
            direccion_matriz: business.direccion ?? '',
          }));
        }
      } finally {
        setLoadingSri(false);
      }
    }
    loadSri();
  }, [business?.id, business?.has_facturacion_sri]);

  // ── Handlers: Cuentas Bancarias ──
  const handleAddAccount = () => {
    setCuentasBancarias(prev => [...prev, {
      id: `bank-${Date.now()}`, banco: 'Banco Pichincha', tipo_cuenta: 'Ahorros',
      numero_cuenta: '', titular: nombre || '', ruc_ci: ruc || '', activa: true,
    }]);
    toast.info('Nueva cuenta bancaria agregada');
  };

  const handleUpdateAccount = (index: number, field: keyof BankDetails, value: any) => {
    setCuentasBancarias(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveAccount = (index: number) => {
    setCuentasBancarias(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setAceptaTransferencia(false);
        toast.info('Se desactivó la transferencia bancaria automáticamente al no tener cuentas.');
      }
      return updated;
    });
    toast.success('Cuenta eliminada');
  };

  // ── Handler: Save Negocio + Pagos ──
  const handleSaveSettings = async () => {
    if (!business) return;
    setIsSaving(true);

    let finalAceptaDeuna = aceptaDeuna;
    if (aceptaDeuna && (!deunaNumero || deunaNumero.trim() === '')) {
      finalAceptaDeuna = false;
      setAceptaDeuna(false);
      toast.info('Deuna! fue desactivado automáticamente porque no ingresaste un número o alias de cobro.');
    }

    const primaryBank = cuentasBancarias[0] || {
      banco: 'Banco Pichincha', tipo_cuenta: 'Ahorros', numero_cuenta: '',
      titular: nombre, ruc_ci: ruc,
    };

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('businesses')
        .update({
          nombre, ruc,
          telefono_whatsapp: telefonoWhatsapp,
          direccion,
          payphone_token: payphoneToken || null,
          datos_bancarios: {
            banco: primaryBank.banco, tipo_cuenta: primaryBank.tipo_cuenta,
            numero_cuenta: primaryBank.numero_cuenta, titular: primaryBank.titular,
            ruc_ci: primaryBank.ruc_ci || ruc, email: (primaryBank as any).email || '',
          },
          configuracion_operativa: {
            tiempo_preparacion: tiempoPreparacion,
            permite_domicilio: permiteDomicilio,
            permite_retiro: permiteRetiro,
            tipo_servicio_mesa: tipoServicioMesa,
            google_maps_url: googleMapsUrl || undefined,
            acepta_deuna: finalAceptaDeuna,
            deuna_numero: deunaNumero,
            deuna_titular: deunaTitular,
            acepta_transferencia: aceptaTransferencia,
            banco: primaryBank.banco, tipo_cuenta: primaryBank.tipo_cuenta,
            numero_cuenta: primaryBank.numero_cuenta, titular: primaryBank.titular,
            ruc_ci: primaryBank.ruc_ci || ruc,
            cuentas_bancarias: cuentasBancarias,
            acepta_payphone: aceptaPayphone,
            acepta_efectivo: aceptaEfectivo,
            instrucciones_efectivo: instruccionesEfectivo,
            horario_activo: horarioActivo,
            horario_apertura: horarioApertura,
            horario_cierre: horarioCierre,
          },
        })
        .eq('id', business.id);

      if (!error) {
        toast.success('Configuración guardada exitosamente');
      } else {
        toast.error(`Error guardando datos: ${error.message}`);
      }
    } catch (err: any) {
      toast.error(`Excepción: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Handlers: SRI ──
  const handleSriFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.p12') && !file.name.endsWith('.pfx')) {
      toast.error('El archivo debe ser .p12 o .pfx');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      setSriForm(prev => ({ ...prev, certificado_p12_base64: base64 }));
      setCertFileName(file.name);
      setCertLoaded(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSri = async () => {
    if (!business) return;
    if (!sriForm.ruc_emisor || sriForm.ruc_emisor.length !== 13) {
      toast.error('El RUC debe tener 13 dígitos'); return;
    }
    if (!sriForm.razon_social) { toast.error('La razón social es requerida'); return; }
    if (!sriForm.direccion_matriz) { toast.error('La dirección matriz es requerida'); return; }
    if (!certLoaded) { toast.error('Debes subir el certificado digital .p12'); return; }
    if (!sriForm.certificado_p12_base64 && !sriConfig?.certificado_p12_base64) {
      toast.error('Debes subir el certificado digital .p12'); return;
    }
    if (!sriForm.certificado_clave && !sriConfig?.certificado_clave) {
      toast.error('La clave del certificado es requerida'); return;
    }

    setSavingSri(true);
    try {
      const supabase = createClient();
      const payload: any = {
        business_id: business.id,
        ruc_emisor: sriForm.ruc_emisor.trim(),
        razon_social: sriForm.razon_social.trim(),
        nombre_comercial: sriForm.nombre_comercial.trim() || sriForm.razon_social.trim(),
        direccion_matriz: sriForm.direccion_matriz.trim(),
        codigo_establecimiento: sriForm.codigo_establecimiento.padStart(3, '0'),
        codigo_punto_emision: sriForm.codigo_punto_emision.padStart(3, '0'),
        ambiente: sriForm.ambiente,
        activo: true,
        updated_at: new Date().toISOString(),
      };
      if (sriForm.certificado_p12_base64) payload.certificado_p12_base64 = sriForm.certificado_p12_base64;
      if (sriForm.certificado_clave) payload.certificado_clave = sriForm.certificado_clave;

      if (sriConfig) {
        const { error } = await supabase.from('business_sri_config').update(payload).eq('id', sriConfig.id);
        if (error) throw error;
      } else {
        payload.secuencial_actual = 1;
        const { error } = await supabase.from('business_sri_config').insert(payload);
        if (error) throw error;
      }

      toast.success('Configuración SRI guardada correctamente');
      setSriForm(prev => ({ ...prev, certificado_p12_base64: '', certificado_clave: '' }));

      const { data } = await supabase
        .from('business_sri_config').select('*').eq('business_id', business.id).maybeSingle();
      if (data) setSriConfig(data as BusinessSriConfig);
    } catch (err: any) {
      toast.error(err.message ?? 'Error guardando configuración');
    } finally {
      setSavingSri(false);
    }
  };

  if (loading || !business || !authorized) {
    return (
      <div className="p-12 text-center text-slate-400 font-display text-sm flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-400" />
        <span>Cargando datos de configuración desde Supabase...</span>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; show?: boolean }[] = [
    { id: 'negocio', label: 'Negocio' },
    { id: 'pagos', label: 'Pagos' },
    { id: 'sri', label: 'Facturación SRI', show: !!business.has_facturacion_sri },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-24">
      {/* Header */}
      <div className="bg-[#0D1322] p-5 rounded-3xl border border-white/10 glass-panel shadow-xl">
        <h1 className="text-xl font-display font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-brand-400" />
          <span>Configuración — {business.nombre}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Datos comerciales, tiempos de entrega, métodos de pago y facturación electrónica SRI.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-950/60 rounded-2xl border border-white/10 w-fit">
        {tabs.filter(t => t.show !== false).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-xl text-xs font-display font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: NEGOCIO ───────────────────────────────────────────── */}
      {activeTab === 'negocio' && (
        <div className="space-y-6">
          {/* Datos Comerciales */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
            <h2 className="font-display font-black text-sm text-brand-400 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-400" />
              <span>Datos Comerciales del Negocio</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">RUC del Negocio</label>
                <input
                  type="text"
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">WhatsApp Notificaciones</label>
                <input
                  type="text"
                  value={telefonoWhatsapp}
                  onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Dirección del Local</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Enlace de Google Maps</label>
              <input
                type="url"
                placeholder="Ej: https://maps.app.goo.gl/..."
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-mono placeholder-slate-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enlace directo al mapa de tu local que se abrirá cuando los clientes hagan clic en "Maps".
              </p>
            </div>
          </div>

          {/* Tiempos & Modalidades */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
            <h2 className="font-display font-black text-sm text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Tiempos de Preparación & Modalidades de Entrega</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">
                  Tiempo Estimado de Preparación
                </label>
                <CustomSelect
                  options={prepTimeOptions}
                  value={tiempoPreparacion}
                  onChange={(val) => setTiempoPreparacion(val)}
                  accentColor="brand"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Este tiempo aparecerá visible para tus clientes en la cabecera de la carta.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">
                  Modalidades de Entrega Habilitadas
                </label>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <CustomCheckbox
                    checked={permiteDomicilio}
                    onChange={setPermiteDomicilio}
                    label="Entrega a Domicilio"
                    description="Permite que tus clientes pidan despacho directo a su dirección"
                    accentColor="brand"
                  />
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <CustomCheckbox
                    checked={permiteRetiro}
                    onChange={setPermiteRetiro}
                    label="Retiro en Local / Takeaway"
                    description="Permite a los clientes hacer el pedido y retirarlo personalmente"
                    accentColor="brand"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-5 space-y-3">
              <label className="block text-xs font-display font-semibold text-slate-300">
                Modalidad de Servicio en Mesa (Consumo en Local)
              </label>
              <p className="text-[11px] text-slate-400">
                ¿Cómo debe operar el flujo cuando el cliente realiza un pedido para consumir en el establecimiento?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTipoServicioMesa('mesero')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    tipoServicioMesa === 'mesero'
                      ? 'bg-brand-500/10 border-brand-500 text-white shadow-lg shadow-brand-500/5'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${tipoServicioMesa === 'mesero' ? 'bg-brand-400 animate-pulse' : 'bg-slate-600'}`}></span>
                    Servicio Tradicional (Mesero a la Mesa)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    El cliente espera en la mesa y un mesero le sirve su comida directamente.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoServicioMesa('barra')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    tipoServicioMesa === 'barra'
                      ? 'bg-brand-500/10 border-brand-500 text-white shadow-lg shadow-brand-500/5'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${tipoServicioMesa === 'barra' ? 'bg-brand-400 animate-pulse' : 'bg-slate-600'}`}></span>
                    Autoservicio / Retiro en Caja (Estilo Fast Food)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    El cliente recibe una notificación y retira su comida de la barra/caja por su cuenta.
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Horarios */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-black text-sm text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Horarios de Atención</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  Muestra "Abierto" o "Cerrado" a tus clientes según la hora actual de Ecuador (UTC−5).
                </p>
              </div>
              <CustomCheckbox
                checked={horarioActivo}
                onChange={setHorarioActivo}
                label=""
                accentColor="brand"
              />
            </div>

            {horarioActivo && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Hora de Apertura</label>
                  <input
                    type="time"
                    value={horarioApertura}
                    onChange={(e) => setHorarioApertura(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Hora de Cierre</label>
                  <input
                    type="time"
                    value={horarioCierre}
                    onChange={(e) => setHorarioCierre(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <p className="col-span-2 text-[11px] text-slate-400">
                  Si el cierre es después de medianoche (ej. apertura 18:00 · cierre 02:00), el sistema lo maneja automáticamente.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: PAGOS ─────────────────────────────────────────────── */}
      {activeTab === 'pagos' && (
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-6 shadow-xl">
          <div>
            <h2 className="font-display font-black text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Métodos de Pago & Datos por Opción</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Habilita los métodos deseados e ingresa la información requerida para que tus clientes puedan pagar correctamente.
            </p>
          </div>

          <div className="space-y-4">
            {/* Deuna! */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-display font-bold text-white">Deuna! (Banco Pichincha)</h3>
                    <p className="text-[11px] text-slate-400">Cobro rápido mediante código QR o número registrado Deuna!</p>
                  </div>
                </div>
                <CustomCheckbox checked={aceptaDeuna} onChange={setAceptaDeuna} label="" accentColor="amber" />
              </div>

              {aceptaDeuna && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Teléfono / Alias Deuna!</label>
                    <input type="text" placeholder="Ej: 0991234567" value={deunaNumero} onChange={(e) => setDeunaNumero(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Titular Deuna!</label>
                    <input type="text" placeholder="Ej: Juan Pérez" value={deunaTitular} onChange={(e) => setDeunaTitular(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Transferencia Bancaria */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-display font-bold text-white flex items-center gap-2">
                      <span>Transferencia Bancaria Directa</span>
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono font-semibold border border-sky-500/30">
                        {cuentasBancarias.length} {cuentasBancarias.length === 1 ? 'cuenta' : 'cuentas'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Configura una o varias cuentas bancarias.</p>
                  </div>
                </div>
                <CustomCheckbox
                  checked={aceptaTransferencia}
                  onChange={(val) => {
                    setAceptaTransferencia(val);
                    if (val && cuentasBancarias.length === 0) handleAddAccount();
                  }}
                  label=""
                  accentColor="sky"
                />
              </div>

              {aceptaTransferencia && (
                <div className="space-y-4 pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
                  {cuentasBancarias.map((acc, index) => (
                    <div key={acc.id || index} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-xs font-display font-bold text-sky-400 flex items-center gap-1.5">
                          <Landmark className="w-3.5 h-3.5" /> Cuenta Bancaria #{index + 1}
                        </span>
                        <button type="button" onClick={() => handleRemoveAccount(index)}
                          className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1 transition-colors p-1">
                          <Trash2 className="w-3.5 h-3.5" /><span className="text-[11px]">Eliminar</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Banco / Institución</label>
                          <CustomSelect
                            options={ECUADOR_BANKS.map((b) => ({ value: b, label: b }))}
                            value={acc.banco || 'Banco Pichincha'}
                            onChange={(val) => handleUpdateAccount(index, 'banco', val)}
                            accentColor="sky"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Tipo de Cuenta</label>
                          <input type="text" placeholder="Cuenta de Ahorros / Corriente" value={acc.tipo_cuenta}
                            onChange={(e) => handleUpdateAccount(index, 'tipo_cuenta', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Número de Cuenta</label>
                          <input type="text" placeholder="Ej: 2200123456" value={acc.numero_cuenta}
                            onChange={(e) => handleUpdateAccount(index, 'numero_cuenta', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Titular de la Cuenta</label>
                          <input type="text" placeholder="Nombre completo o Razón Social" value={acc.titular}
                            onChange={(e) => handleUpdateAccount(index, 'titular', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">RUC / Cédula</label>
                          <input type="text" placeholder="Ej: 0104598123001" value={acc.ruc_ci || ''}
                            onChange={(e) => handleUpdateAccount(index, 'ruc_ci', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono" />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={handleAddAccount}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-sky-500/40 bg-sky-500/5 text-sky-400 text-xs font-display font-semibold hover:bg-sky-500/10 hover:border-sky-500 flex items-center justify-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>+ Agregar Otra Cuenta Bancaria</span>
                  </button>
                </div>
              )}
            </div>

            {/* PayPhone */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-display font-bold text-white flex items-center gap-2">
                      <span>PayPhone Ecuador (Tarjetas de Crédito / Débito)</span>
                      {!business.has_payphone && (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                          Módulo no contratado (+$9/m)
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">Cobro automatizado en línea con tarjetas Visa / Mastercard</p>
                  </div>
                </div>
                {business.has_payphone && (
                  <CustomCheckbox checked={aceptaPayphone} onChange={setAceptaPayphone} label="" accentColor="purple" />
                )}
              </div>

              {!business.has_payphone ? (
                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    Activa la pasarela PayPhone para recibir pagos con tarjeta de crédito o débito.
                  </p>
                  <a
                    href={`https://wa.me/593969307527?text=${encodeURIComponent(`Hola! Soy de ${business.nombre} (/${business.slug}). Me gustaría activar el módulo Add-on de PayPhone Tarjetas (+$9/mes) en Kaltiro.com.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-display font-bold text-xs shrink-0 shadow-lg shadow-purple-500/20 transition-all">
                    Solicitar Módulo por WhatsApp
                  </a>
                </div>
              ) : aceptaPayphone && (
                <div className="pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
                  <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Token de Comercio PayPhone</label>
                  <div className="relative">
                    <input
                      type={showPayphoneToken ? 'text' : 'password'}
                      placeholder="Token JWT proporcionado por PayPhone Ecuador"
                      value={payphoneToken}
                      onChange={(e) => setPayphoneToken(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                    />
                    <button type="button" onClick={() => setShowPayphoneToken((v) => !v)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors" tabIndex={-1}>
                      {showPayphoneToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Efectivo */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-display font-bold text-white">Efectivo Contra Entrega</h3>
                    <p className="text-[11px] text-slate-400">Cobro directo en efectivo al repartidor o en caja al retirar</p>
                  </div>
                </div>
                <CustomCheckbox checked={aceptaEfectivo} onChange={setAceptaEfectivo} label="" accentColor="brand" />
              </div>

              {aceptaEfectivo && (
                <div className="pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
                  <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Instrucciones para Pago en Efectivo</label>
                  <input type="text"
                    placeholder="Ej: Pago en efectivo al entregar. El cliente indicará si necesita cambio."
                    value={instruccionesEfectivo}
                    onChange={(e) => setInstruccionesEfectivo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: FACTURACIÓN SRI ────────────────────────────────────── */}
      {activeTab === 'sri' && business.has_facturacion_sri && (
        <div className="space-y-6">
          {loadingSri ? (
            <div className="flex items-center justify-center min-h-[40vh] gap-2 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-brand-400" />
              <span className="text-sm">Cargando configuración SRI...</span>
            </div>
          ) : (
            <>
              {/* Status */}
              {sriConfig && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                  sriConfig.ambiente === 'produccion'
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-amber-500/5 border-amber-500/20'
                }`}>
                  {sriConfig.ambiente === 'produccion'
                    ? <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    : <FlaskConical className="w-5 h-5 text-amber-400 shrink-0" />
                  }
                  <div>
                    <p className="text-xs font-display font-bold text-white">
                      Ambiente: <span className={sriConfig.ambiente === 'produccion' ? 'text-emerald-400' : 'text-amber-400'}>
                        {sriConfig.ambiente === 'produccion' ? 'PRODUCCIÓN' : 'PRUEBAS'}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Próximo secuencial: {String(sriConfig.secuencial_actual).padStart(9, '0')} ·
                      Certificado: {sriConfig.certificado_p12_base64 ? '✓ Cargado' : '✗ Sin certificado'}
                    </p>
                  </div>
                </div>
              )}

              {/* Formulario */}
              <div className="bg-[#0B0F1B] border border-white/10 rounded-3xl p-6 space-y-6">

                {/* Datos del emisor */}
                <div>
                  <h2 className="text-sm font-display font-black text-white mb-4 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-brand-400" /> Datos del Emisor
                  </h2>
                  <div className="space-y-4">
                    {[
                      { label: 'RUC Emisor', key: 'ruc_emisor', placeholder: '0000000000001', maxLength: 13, hint: '13 dígitos — RUC del negocio que emite las facturas' },
                      { label: 'Razón Social', key: 'razon_social', placeholder: 'NOMBRE APELLIDO / EMPRESA S.A.', hint: 'Exactamente como aparece en el SRI' },
                      { label: 'Nombre Comercial', key: 'nombre_comercial', placeholder: 'Nombre del local (opcional)' },
                      { label: 'Dirección Matriz', key: 'direccion_matriz', placeholder: 'Av. Principal 123 y Calle Secundaria' },
                    ].map(({ label, key, placeholder, maxLength, hint }) => (
                      <div key={key}>
                        <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1.5">{label}</label>
                        <input
                          type="text"
                          placeholder={placeholder}
                          maxLength={maxLength}
                          value={sriForm[key as keyof typeof sriForm] as string}
                          onChange={e => setSriForm(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-2xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors font-mono"
                        />
                        {hint && (
                          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <Info className="w-3 h-3" /> {hint}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/5" />

                {/* Serie */}
                <div>
                  <h2 className="text-sm font-display font-black text-white mb-4 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-brand-400" /> Serie del Comprobante
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Código Establecimiento', key: 'codigo_establecimiento', hint: '3 dígitos, ej: 001' },
                      { label: 'Código Punto de Emisión', key: 'codigo_punto_emision', hint: '3 dígitos, ej: 001' },
                    ].map(({ label, key, hint }) => (
                      <div key={key}>
                        <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1.5">{label}</label>
                        <input
                          type="text"
                          placeholder="001"
                          maxLength={3}
                          value={sriForm[key as keyof typeof sriForm] as string}
                          onChange={e => setSriForm(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-2xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors font-mono"
                        />
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <Info className="w-3 h-3" /> {hint}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-400 font-mono">
                    Serie: {sriForm.codigo_establecimiento.padStart(3, '0')}-{sriForm.codigo_punto_emision.padStart(3, '0')}-
                    {String(sriConfig?.secuencial_actual ?? 1).padStart(9, '0')}
                  </div>
                </div>

                <div className="border-t border-white/5" />

                {/* Ambiente */}
                <div>
                  <h2 className="text-sm font-display font-black text-white mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-brand-400" /> Ambiente SRI
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {(['pruebas', 'produccion'] as const).map((amb) => (
                      <button
                        key={amb}
                        onClick={() => setSriForm(prev => ({ ...prev, ambiente: amb }))}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          sriForm.ambiente === amb
                            ? amb === 'produccion'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {amb === 'produccion'
                            ? <ShieldCheck className="w-4 h-4" />
                            : <FlaskConical className="w-4 h-4" />
                          }
                          <span className="font-display font-black text-xs uppercase">
                            {amb === 'produccion' ? 'Producción' : 'Pruebas'}
                          </span>
                          {sriForm.ambiente === amb && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
                        </div>
                        <p className="text-[10px] opacity-70">
                          {amb === 'produccion' ? 'Facturas reales autorizadas por el SRI' : 'Para testear sin efectos reales'}
                        </p>
                      </button>
                    ))}
                  </div>

                  {sriForm.ambiente === 'produccion' && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-[11px] text-rose-300 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      En producción, cada factura emitida queda registrada en el SRI y tiene valor legal.
                    </div>
                  )}
                </div>

                <div className="border-t border-white/5" />

                {/* Certificado */}
                <div>
                  <h2 className="text-sm font-display font-black text-white mb-1 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-brand-400" /> Certificado Digital (.p12)
                  </h2>
                  <p className="text-[11px] text-slate-400 mb-4">
                    Firma electrónica emitida por el BCE o Security Data. Formato .p12 o .pfx.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <input ref={fileRef} type="file" accept=".p12,.pfx" onChange={handleSriFile} className="hidden" />
                      <button
                        onClick={() => fileRef.current?.click()}
                        className={`w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed transition-all ${
                          certLoaded
                            ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300'
                            : 'border-white/10 hover:border-brand-500/30 text-slate-400 hover:text-brand-300'
                        }`}
                      >
                        {certLoaded ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-display font-bold">{certFileName}</span>
                            <span className="text-[10px] opacity-60">— click para cambiar</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span className="text-xs font-display font-bold">Subir certificado .p12 / .pfx</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1.5">Clave del Certificado</label>
                      <div className="relative">
                        <input
                          type={showClave ? 'text' : 'password'}
                          placeholder={sriConfig?.certificado_clave ? '••••••••••• (guardada)' : 'Contraseña del archivo .p12'}
                          value={sriForm.certificado_clave}
                          onChange={e => setSriForm(prev => ({ ...prev, certificado_clave: e.target.value }))}
                          className="w-full px-4 py-2.5 pr-10 rounded-2xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors font-mono"
                        />
                        <button type="button" onClick={() => setShowClave(!showClave)}
                          className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors">
                          {showClave ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {sriConfig?.certificado_clave ? 'Dejar vacío para mantener la clave guardada' : 'Contraseña con la que se generó el archivo .p12'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Nota seguridad */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-500 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <span>
                  El certificado se almacena en base64 en la base de datos. El certificado nunca se transmite al cliente.
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Botón flotante — todos los tabs */}
      <div className="fixed bottom-6 right-6 md:right-8 z-50">
        <button
          type="button"
          onClick={activeTab === 'sri' ? handleSaveSri : handleSaveSettings}
          disabled={activeTab === 'sri' ? savingSri : isSaving}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-display font-black text-xs md:text-sm shadow-2xl shadow-brand-500/40 border border-brand-400/30 flex items-center gap-2.5 active:scale-95 transition-all backdrop-blur-xl group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {(activeTab === 'sri' ? savingSri : isSaving)
            ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Guardando...</span></>
            : <><Save className="w-4 h-4 text-brand-100 group-hover:rotate-12 transition-transform" /><span>Guardar Cambios</span></>
          }
        </button>
      </div>
    </div>
  );
}
