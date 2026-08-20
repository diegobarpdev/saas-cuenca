'use client';

import React, { use, useState, useEffect, useRef } from 'react';
import {
  KeyRound, RefreshCw, Save, Upload, Eye, EyeOff, ShieldCheck,
  AlertCircle, CheckCircle2, FlaskConical, Globe, Loader2, Info, Hash,
  BookOpen, Receipt, Building2,
} from 'lucide-react';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/utils/toast';
import type { BusinessSriConfig } from '@/lib/types/database';

export default function SriConfigPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { business, loading: loadingBusiness } = useAdminBusiness(slug);

  const [config, setConfig] = useState<BusinessSriConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showClave, setShowClave] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    ruc_emisor: '',
    razon_social: '',
    nombre_comercial: '',
    direccion_matriz: '',
    codigo_establecimiento: '001',
    codigo_punto_emision: '001',
    ambiente: 'pruebas' as 'pruebas' | 'produccion',
    certificado_p12_base64: '',
    certificado_clave: '',
    regimen_tributario: 'GENERAL' as 'GENERAL' | 'RIMPE_EMPRENDEDOR' | 'RIMPE_NEGOCIO_POPULAR',
    obligado_contabilidad: false,
    es_contribuyente_especial: false,
    numero_contribuyente_especial: '',
    es_agente_retencion: false,
    numero_resolucion_retencion: '',
  });

  const [certFileName, setCertFileName] = useState('');
  const [certLoaded, setCertLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      if (!business) return;
      setLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('business_sri_config')
          .select('*')
          .eq('business_id', business.id)
          .maybeSingle();

        if (data) {
          setConfig(data as BusinessSriConfig);
          setForm({
            ruc_emisor: data.ruc_emisor ?? '',
            razon_social: data.razon_social ?? '',
            nombre_comercial: data.nombre_comercial ?? '',
            direccion_matriz: data.direccion_matriz ?? '',
            codigo_establecimiento: data.codigo_establecimiento ?? '001',
            codigo_punto_emision: data.codigo_punto_emision ?? '001',
            ambiente: data.ambiente ?? 'pruebas',
            certificado_p12_base64: '',  // no precargamos el cert por seguridad
            certificado_clave: '',
            regimen_tributario: (data as any).regimen_tributario ?? 'GENERAL',
            obligado_contabilidad: (data as any).obligado_contabilidad ?? false,
            es_contribuyente_especial: (data as any).es_contribuyente_especial ?? false,
            numero_contribuyente_especial: (data as any).numero_contribuyente_especial ?? '',
            es_agente_retencion: (data as any).es_agente_retencion ?? false,
            numero_resolucion_retencion: (data as any).numero_resolucion_retencion ?? '',
          });
          if (data.certificado_p12_base64) {
            setCertLoaded(true);
            setCertFileName('Certificado cargado');
          }
        } else {
          // Pre-fill con datos del negocio
          setForm(prev => ({
            ...prev,
            ruc_emisor: business.ruc ?? '',
            razon_social: business.nombre ?? '',
            nombre_comercial: business.nombre ?? '',
            direccion_matriz: business.direccion ?? '',
          }));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [business?.id]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.p12') && !file.name.endsWith('.pfx')) {
      toast.error('El archivo debe ser .p12 o .pfx');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      setForm(prev => ({ ...prev, certificado_p12_base64: base64 }));
      setCertFileName(file.name);
      setCertLoaded(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!business) return;

    // Validaciones
    if (!form.ruc_emisor || form.ruc_emisor.length !== 13) {
      toast.error('El RUC debe tener 13 dígitos');
      return;
    }
    if (!form.razon_social) {
      toast.error('La razón social es requerida');
      return;
    }
    if (!form.direccion_matriz) {
      toast.error('La dirección matriz es requerida');
      return;
    }
    if (!certLoaded) {
      toast.error('Debes subir el certificado digital .p12');
      return;
    }
    if (!form.certificado_p12_base64 && !config?.certificado_p12_base64) {
      toast.error('Debes subir el certificado digital .p12');
      return;
    }
    if (!form.certificado_clave && !config?.certificado_clave) {
      toast.error('La clave del certificado es requerida');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const payload: any = {
        business_id: business.id,
        ruc_emisor: form.ruc_emisor.trim(),
        razon_social: form.razon_social.trim(),
        nombre_comercial: form.nombre_comercial.trim() || form.razon_social.trim(),
        direccion_matriz: form.direccion_matriz.trim(),
        codigo_establecimiento: form.codigo_establecimiento.padStart(3, '0'),
        codigo_punto_emision: form.codigo_punto_emision.padStart(3, '0'),
        ambiente: form.ambiente,
        activo: true,
        updated_at: new Date().toISOString(),
        regimen_tributario: form.regimen_tributario,
        obligado_contabilidad: form.obligado_contabilidad,
        es_contribuyente_especial: form.es_contribuyente_especial,
        numero_contribuyente_especial: form.es_contribuyente_especial ? form.numero_contribuyente_especial.trim() || null : null,
        es_agente_retencion: form.es_agente_retencion,
        numero_resolucion_retencion: form.es_agente_retencion ? form.numero_resolucion_retencion.trim() || null : null,
      };

      // Solo actualizar cert si se subió uno nuevo
      if (form.certificado_p12_base64) {
        payload.certificado_p12_base64 = form.certificado_p12_base64;
      }
      if (form.certificado_clave) {
        payload.certificado_clave = form.certificado_clave;
      }

      if (config) {
        const { error } = await supabase
          .from('business_sri_config')
          .update(payload)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        payload.secuencial_actual = 1;
        const { error } = await supabase
          .from('business_sri_config')
          .insert(payload);
        if (error) throw error;
      }

      toast.success('Configuración SRI guardada correctamente');

      // Limpiar campos sensibles del form
      setForm(prev => ({ ...prev, certificado_p12_base64: '', certificado_clave: '' }));

      // Reload
      const { data } = await supabase
        .from('business_sri_config')
        .select('*')
        .eq('business_id', business.id)
        .maybeSingle();
      if (data) setConfig(data as BusinessSriConfig);
    } catch (err: any) {
      toast.error(err.message ?? 'Error guardando configuración');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, opts?: {
    placeholder?: string;
    maxLength?: number;
    hint?: string;
    type?: string;
  }) => (
    <div>
      <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1.5">
        {label}
      </label>
      <input
        type={opts?.type ?? 'text'}
        placeholder={opts?.placeholder ?? ''}
        maxLength={opts?.maxLength}
        value={form[key] as string}
        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
        className="w-full px-4 py-2.5 rounded-2xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors font-mono"
      />
      {opts?.hint && (
        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
          <Info className="w-3 h-3" /> {opts.hint}
        </p>
      )}
    </div>
  );

  if (loadingBusiness || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-2 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-400" />
        <span className="text-sm">Cargando configuración SRI...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-20">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-[#0D1322] border border-white/10 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 text-xs font-mono-tech border border-brand-500/30 mb-3">
          <KeyRound className="w-3.5 h-3.5" /> Configuración SRI
        </div>
        <h1 className="text-2xl font-display font-black text-white tracking-tight">
          Configuración Facturación Electrónica
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Datos del emisor y certificado digital para emitir facturas electrónicas ante el SRI.
        </p>
      </div>

      {/* Status actual */}
      {config && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
          config.ambiente === 'produccion'
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : 'bg-amber-500/5 border-amber-500/20'
        }`}>
          {config.ambiente === 'produccion'
            ? <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            : <FlaskConical className="w-5 h-5 text-amber-400 shrink-0" />
          }
          <div>
            <p className="text-xs font-display font-bold text-white">
              Ambiente: <span className={config.ambiente === 'produccion' ? 'text-emerald-400' : 'text-amber-400'}>
                {config.ambiente === 'produccion' ? 'PRODUCCIÓN' : 'PRUEBAS'}
              </span>
            </p>
            <p className="text-[11px] text-slate-400">
              Próximo secuencial: {String(config.secuencial_actual).padStart(9, '0')} ·
              Certificado: {config.certificado_p12_base64 ? '✓ Cargado' : '✗ Sin certificado'}
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
            {field('RUC Emisor', 'ruc_emisor', {
              placeholder: '0000000000001',
              maxLength: 13,
              hint: '13 dígitos — RUC del negocio que emite las facturas',
            })}
            {field('Razón Social', 'razon_social', {
              placeholder: 'NOMBRE APELLIDO / EMPRESA S.A.',
              hint: 'Exactamente como aparece en el SRI',
            })}
            {field('Nombre Comercial', 'nombre_comercial', {
              placeholder: 'Nombre del local (opcional)',
            })}
            {field('Dirección Matriz', 'direccion_matriz', {
              placeholder: 'Av. Principal 123 y Calle Secundaria',
            })}
          </div>
        </div>

        <div className="border-t border-white/5" />

        {/* Serie */}
        <div>
          <h2 className="text-sm font-display font-black text-white mb-4 flex items-center gap-2">
            <Hash className="w-4 h-4 text-brand-400" /> Serie del Comprobante
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {field('Código Establecimiento', 'codigo_establecimiento', {
              placeholder: '001',
              maxLength: 3,
              hint: '3 dígitos, ej: 001',
            })}
            {field('Código Punto de Emisión', 'codigo_punto_emision', {
              placeholder: '001',
              maxLength: 3,
              hint: '3 dígitos, ej: 001',
            })}
          </div>
          <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-400 font-mono">
            Serie: {form.codigo_establecimiento.padStart(3, '0')}-{form.codigo_punto_emision.padStart(3, '0')}-
            {String(config?.secuencial_actual ?? 1).padStart(9, '0')}
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
                onClick={() => setForm(prev => ({ ...prev, ambiente: amb }))}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  form.ambiente === amb
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
                  {form.ambiente === amb && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
                </div>
                <p className="text-[10px] opacity-70">
                  {amb === 'produccion'
                    ? 'Facturas reales autorizadas por el SRI'
                    : 'Para testear sin efectos reales'
                  }
                </p>
              </button>
            ))}
          </div>

          {form.ambiente === 'produccion' && (
            <div className="mt-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-[11px] text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              En producción, cada factura emitida queda registrada en el SRI y tiene valor legal. Asegúrate de que el certificado y los datos sean correctos.
            </div>
          )}
        </div>

        <div className="border-t border-white/5" />

        {/* Régimen Tributario */}
        <div>
          <h2 className="text-sm font-display font-black text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-400" /> Régimen Tributario
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              { value: 'GENERAL', label: 'Régimen General' },
              { value: 'RIMPE_EMPRENDEDOR', label: 'RIMPE Emprendedor' },
              { value: 'RIMPE_NEGOCIO_POPULAR', label: 'RIMPE Negocio Popular' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm(prev => ({ ...prev, regimen_tributario: opt.value }))}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  form.regimen_tributario === opt.value
                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-300'
                    : 'bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  {form.regimen_tributario === opt.value && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  <span className="font-display font-black text-xs">{opt.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5" />

        {/* Opciones fiscales */}
        <div>
          <h2 className="text-sm font-display font-black text-white mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-400" /> Obligaciones Fiscales
          </h2>
          <div className="space-y-4">

            {/* Obligado a contabilidad */}
            <div
              onClick={() => setForm(prev => ({ ...prev, obligado_contabilidad: !prev.obligado_contabilidad }))}
              className="flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all bg-slate-950/40 border-white/5 hover:border-white/10"
            >
              <div>
                <p className="text-sm font-display font-bold text-white">Obligado a llevar contabilidad</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Aplica si los ingresos brutos superan $300,000 anuales</p>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors relative ${form.obligado_contabilidad ? 'bg-brand-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.obligado_contabilidad ? 'left-5' : 'left-1'}`} />
              </div>
            </div>

            {/* Contribuyente especial */}
            <div>
              <div
                onClick={() => setForm(prev => ({ ...prev, es_contribuyente_especial: !prev.es_contribuyente_especial }))}
                className="flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all bg-slate-950/40 border-white/5 hover:border-white/10"
              >
                <div>
                  <p className="text-sm font-display font-bold text-white">Contribuyente especial</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Calificado por el SRI como contribuyente especial</p>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors relative ${form.es_contribuyente_especial ? 'bg-brand-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.es_contribuyente_especial ? 'left-5' : 'left-1'}`} />
                </div>
              </div>
              {form.es_contribuyente_especial && (
                <div className="mt-2 ml-4">
                  <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1.5">
                    Número de Resolución (Contribuyente Especial)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 1234"
                    value={form.numero_contribuyente_especial}
                    onChange={e => setForm(prev => ({ ...prev, numero_contribuyente_especial: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors font-mono"
                  />
                </div>
              )}
            </div>

            {/* Agente de retención */}
            <div>
              <div
                onClick={() => setForm(prev => ({ ...prev, es_agente_retencion: !prev.es_agente_retencion }))}
                className="flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all bg-slate-950/40 border-white/5 hover:border-white/10"
              >
                <div>
                  <p className="text-sm font-display font-bold text-white">Agente de retención</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Habilitado para emitir comprobantes de retención a proveedores</p>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors relative ${form.es_agente_retencion ? 'bg-brand-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.es_agente_retencion ? 'left-5' : 'left-1'}`} />
                </div>
              </div>
              {form.es_agente_retencion && (
                <div className="mt-2 ml-4">
                  <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1.5">
                    Número de Resolución (Agente de Retención)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: NAC-DNCRASC19-00000001"
                    value={form.numero_resolucion_retencion}
                    onChange={e => setForm(prev => ({ ...prev, numero_resolucion_retencion: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors font-mono"
                  />
                </div>
              )}
            </div>

          </div>
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
            {/* Upload */}
            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".p12,.pfx"
                onChange={handleFile}
                className="hidden"
              />
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

            {/* Clave del certificado */}
            <div>
              <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1.5">
                Clave del Certificado
              </label>
              <div className="relative">
                <input
                  type={showClave ? 'text' : 'password'}
                  placeholder={config?.certificado_clave ? '••••••••••• (guardada)' : 'Contraseña del archivo .p12'}
                  value={form.certificado_clave}
                  onChange={e => setForm(prev => ({ ...prev, certificado_clave: e.target.value }))}
                  className="w-full px-4 py-2.5 pr-10 rounded-2xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowClave(!showClave)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showClave ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {config?.certificado_clave
                  ? 'Dejar vacío para mantener la clave guardada'
                  : 'Contraseña con la que se generó el archivo .p12'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Guardar */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-bold text-sm transition-colors shadow-xl shadow-brand-500/20"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              : <><Save className="w-4 h-4" /> Guardar Configuración SRI</>
            }
          </button>
        </div>
      </div>

      {/* Nota de seguridad */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-500 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
        <span>
          El certificado se almacena cifrado en base64 en la base de datos. Para mayor seguridad en producción,
          se recomienda cifrar adicionalmente con una clave de entorno. El certificado nunca se transmite al cliente.
        </span>
      </div>
    </div>
  );
}
