'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Save, Sparkles, CreditCard, Bell, Printer, Database } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomCheckbox } from '@/components/ui/CustomCheckbox';

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


  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-5xl">
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

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* 1. Datos Principales */}
      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
          <Building2 className="w-4 h-4 text-zinc-400" />
          <h2 className="font-semibold text-sm text-zinc-100">Datos Principales del Negocio</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Nombre Comercial *</label>
            <input
              type="text"
              required
              placeholder="Ej: Cafetería El Parque"
              value={nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Slug URL Único *</label>
            <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden focus-within:border-zinc-600 transition-colors">
              <span className="px-3 text-xs text-zinc-500 bg-zinc-900 py-2 border-r border-zinc-800">kaltiro.com/</span>
              <input
                type="text"
                required
                placeholder="cafeteria-el-parque"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 bg-transparent text-xs text-zinc-100 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">WhatsApp Notificaciones *</label>
            <input
              type="text"
              required
              placeholder="593969307527"
              value={telefonoWhatsapp}
              onChange={(e) => setTelefonoWhatsapp(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">RUC del Negocio</label>
            <input
              type="text"
              placeholder="0104598123001"
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Plan de Suscripción</label>
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
          <label className="block text-xs font-medium text-zinc-300 mb-1">Dirección del Local en Cuenca</label>
          <input
            type="text"
            placeholder="Ej: Calle Larga y Benigno Malo"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>
      </div>

      {/* 2. Módulos Add-ons */}
      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h2 className="font-semibold text-sm text-zinc-100">Módulos Add-ons</h2>
          <span className="text-[10px] text-zinc-500 ml-auto">Opcional — se pueden activar después</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <CustomCheckbox
              checked={hasPayphone}
              onChange={setHasPayphone}
              accentColor="purple"
              label={<span className="flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 text-purple-400" /> PayPhone Tarjetas</span>}
            />
            <span className="text-[10px] text-zinc-500 font-mono">+$9/m</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <CustomCheckbox
              checked={hasLiveKitchen}
              onChange={setHasLiveKitchen}
              accentColor="purple"
              label={<span className="flex items-center gap-2"><Bell className="w-3.5 h-3.5 text-purple-400" /> Monitor Cocina KDS</span>}
            />
            <span className="text-[10px] text-zinc-500 font-mono">+$7/m</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <CustomCheckbox
              checked={hasPosPrinting}
              onChange={setHasPosPrinting}
              accentColor="purple"
              label={<span className="flex items-center gap-2"><Printer className="w-3.5 h-3.5 text-purple-400" /> Impresión POS</span>}
            />
            <span className="text-[10px] text-zinc-500 font-mono">+$7/m</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <CustomCheckbox
              checked={hasCrmExport}
              onChange={setHasCrmExport}
              accentColor="purple"
              label={<span className="flex items-center gap-2"><Database className="w-3.5 h-3.5 text-purple-400" /> Reportes & CRM</span>}
            />
            <span className="text-[10px] text-zinc-500 font-mono">+$5/m</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2 transition-all border border-purple-400/30 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        <span>{isSubmitting ? 'Guardando...' : 'Crear e Inicializar Empresa'}</span>
      </button>
    </form>
  );
}
