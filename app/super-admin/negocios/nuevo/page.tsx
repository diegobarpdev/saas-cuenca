'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Save, Sparkles, CreditCard, Bell, Printer, Database } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function CreateBusinessPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [ruc, setRuc] = useState('');
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('593');
  const [direccion, setDireccion] = useState('');
  const [plan, setPlan] = useState<'trial' | 'basico'>('basico');
  const [hasPayphone, setHasPayphone] = useState(false);
  const [hasLiveKitchen, setHasLiveKitchen] = useState(false);
  const [hasPosPrinting, setHasPosPrinting] = useState(false);
  const [hasCrmExport, setHasCrmExport] = useState(false);
  const [hasCustomDomain, setHasCustomDomain] = useState(false);

  // Datos bancarios iniciales
  const [banco, setBanco] = useState('Banco Pichincha');
  const [tipoCuenta, setTipoCuenta] = useState('Ahorros');
  const [numeroCuenta, setNumeroCuenta] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNombreChange = (val: string) => {
    setNombre(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombre || !slug || !telefonoWhatsapp) {
      setErrorMsg('Por favor completa el nombre, el slug de URL y el teléfono WhatsApp.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.from('businesses').insert({
        nombre,
        slug,
        ruc: ruc || null,
        telefono_whatsapp: telefonoWhatsapp,
        direccion: direccion || null,
        plan: plan,
        has_payphone: hasPayphone,
        has_live_kitchen: hasLiveKitchen,
        has_pos_printing: hasPosPrinting,
        has_crm_export: hasCrmExport,
        has_custom_domain: hasCustomDomain,
        datos_bancarios: {
          banco,
          tipo_cuenta: tipoCuenta,
          numero_cuenta: numeroCuenta,
          titular: nombre,
          ruc_ci: ruc || '',
          email: '',
        },
        zonas_envio: [
          { id: 'z1', zona: 'Centro Histórico / El Ejido', costo: 1.50 },
          { id: 'z2', zona: 'Totoracocha / Monay', costo: 2.00 },
          { id: 'z3', zona: 'Yanuncay / Baños', costo: 2.50 },
          { id: 'z4', zona: 'Challuabamba / Ricaurte', costo: 3.50 },
        ],
      });

      if (error) {
        if (error.code === '23505') {
          setErrorMsg(`El slug "/${slug}" ya está registrado por otra empresa. Por favor elige otro.`);
        } else {
          setErrorMsg(`Error guardando en la base de datos: ${error.message}`);
        }
        setIsSubmitting(false);
        return;
      }

      router.push('/super-admin/dashboard');
    } catch (err: any) {
      setErrorMsg(`Excepción: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  const planOptions = [
    { value: 'trial', label: 'Trial (Prueba Gratuita 15 días)' },
    { value: 'basico', label: 'Plan Básico ($15/mes)' },
    { value: 'pro', label: 'Plan PRO ($29/mes - Recomendado)' },
  ];

  const bancoOptions = [
    { value: 'Banco Pichincha', label: 'Banco Pichincha (Deuna! / Pichincha)' },
    { value: 'Banco Guayaquil', label: 'Banco Guayaquil' },
    { value: 'Produbanco', label: 'Produbanco' },
    { value: 'Banco del Austro', label: 'Banco del Austro' },
    { value: 'Cooperativa JEP', label: 'Cooperativa JEP' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/super-admin/dashboard"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Empresas</span>
        </Link>
      </div>

      <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 shadow-2xl space-y-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-mono-tech border border-purple-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Alta de Empresa Multi-Tenant
          </span>
          <h1 className="text-2xl font-display font-black text-white tracking-tight mt-2">
            Registrar Nueva Empresa en Yapi.ec
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Se creará la empresa en Supabase Postgres con su propia URL exclusiva y aislamiento RLS.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Datos Principales */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <h3 className="font-display font-bold text-sm text-purple-300 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> 1. Datos Principales del Negocio
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Nombre Comercial *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cafetería El Parque"
                  value={nombre}
                  onChange={(e) => handleNombreChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Slug URL Único *</label>
                <div className="flex items-center rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden focus-within:border-purple-500">
                  <span className="px-3 text-xs text-slate-500 bg-slate-900/60 py-3 border-r border-slate-800">tuapp.com/</span>
                  <input
                    type="text"
                    required
                    placeholder="cafeteria-el-parque"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-3 bg-transparent text-sm text-white focus:outline-none font-mono-tech"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">WhatsApp Notificaciones *</label>
                <input
                  type="text"
                  required
                  placeholder="593969307527"
                  value={telefonoWhatsapp}
                  onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-purple-500 font-mono-tech"
                />
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">RUC del Negocio</label>
                <input
                  type="text"
                  placeholder="0104598123001"
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-purple-500 font-mono-tech"
                />
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Plan de Suscripción</label>
                <CustomSelect
                  options={[
                    { value: 'basico', label: 'Plan Base Core ($15/mes)' },
                    { value: 'trial', label: 'Trial (Prueba Gratuita 14 días)' },
                  ]}
                  value={plan}
                  onChange={(val) => setPlan(val as any)}
                  accentColor="purple"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Dirección del Local en Cuenca</label>
              <input
                type="text"
                placeholder="Ej: Calle Larga y Benigno Malo"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Módulos Add-ons Iniciales */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-purple-500/20 space-y-3">
              <label className="block text-xs font-display font-bold text-purple-300">Activar Módulos Add-ons Iniciales (Opcional)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40">
                  <input
                    type="checkbox"
                    checked={hasPayphone}
                    onChange={(e) => setHasPayphone(e.target.checked)}
                    className="rounded accent-purple-500"
                  />
                  <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-purple-400" /> PayPhone Tarjetas (+$9/m)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40">
                  <input
                    type="checkbox"
                    checked={hasLiveKitchen}
                    onChange={(e) => setHasLiveKitchen(e.target.checked)}
                    className="rounded accent-purple-500"
                  />
                  <span className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-purple-400" /> Alertas Cocina (+$7/m)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40">
                  <input
                    type="checkbox"
                    checked={hasPosPrinting}
                    onChange={(e) => setHasPosPrinting(e.target.checked)}
                    className="rounded accent-purple-500"
                  />
                  <span className="flex items-center gap-1.5"><Printer className="w-3.5 h-3.5 text-purple-400" /> Impresión POS (+$7/m)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40">
                  <input
                    type="checkbox"
                    checked={hasCrmExport}
                    onChange={(e) => setHasCrmExport(e.target.checked)}
                    className="rounded accent-purple-500"
                  />
                  <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-purple-400" /> CRM Exportación (+$5/m)</span>
                </label>
              </div>
            </div>
          </div>

          {/* 2. Datos Bancarios Iniciales */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="font-display font-bold text-sm text-purple-300">2. Datos Bancarios Iniciales (Deuna / Transferencia)</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Banco</label>
                <CustomSelect
                  options={bancoOptions}
                  value={banco}
                  onChange={(val) => setBanco(val)}
                  accentColor="purple"
                />
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Nro. de Cuenta</label>
                <input
                  type="text"
                  placeholder="2204589102"
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white font-mono-tech"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-display font-black text-sm shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all border border-purple-400/30 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Guardando en Supabase Postgres...' : 'Crear e Inicializar Empresa'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
