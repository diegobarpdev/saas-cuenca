'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, Save, CreditCard, Bell, Printer,
  Database, Globe, Receipt, Eye, EyeOff, CheckCircle2,
  XCircle, RefreshCw, Sparkles, ShieldCheck, ExternalLink, LogIn, Boxes,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomCheckbox } from '@/components/ui/CustomCheckbox';
import { Business } from '@/lib/types/database';

const planOptions = [
  { value: 'trial',  label: 'Trial — Prueba Gratuita 14 días' },
  { value: 'basico', label: 'Plan Base ($15/mes)' },
];

export default function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  // Datos principales
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [ruc, setRuc] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [direccion, setDireccion] = useState('');
  const [plan, setPlan] = useState<'trial' | 'basico' | string>('trial');

  // Módulos
  const [hasPayphone, setHasPayphone] = useState(false);
  const [hasLiveKitchen, setHasLiveKitchen] = useState(false);
  const [hasPosPrinting, setHasPosPrinting] = useState(false);
  const [hasCrmExport, setHasCrmExport] = useState(false);
  const [hasCustomDomain, setHasCustomDomain] = useState(false);
  const [hasFacturacionSri, setHasFacturacionSri] = useState(false);
  const [hasMermas, setHasMermas] = useState(false);

  // PayPhone config
  const [payphoneToken, setPayphoneToken] = useState('');
  const [payphoneAmbiente, setPayphoneAmbiente] = useState<'pruebas' | 'produccion'>('pruebas');
  const [showToken, setShowToken] = useState(false);
  const [testingPayphone, setTestingPayphone] = useState(false);
  const [payphoneTestResult, setPayphoneTestResult] = useState<'ok' | 'error' | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.from('businesses').select('*').eq('id', id).single();
      if (error || !data) { setLoading(false); return; }
      const b = data as Business;
      setBusiness(b);
      setNombre(b.nombre);
      setSlug(b.slug);
      setRuc(b.ruc || '');
      setWhatsapp(b.telefono_whatsapp || '');
      setDireccion(b.direccion || '');
      setPlan(b.plan || 'trial');
      setHasPayphone(b.has_payphone || false);
      setHasLiveKitchen(b.has_live_kitchen || false);
      setHasPosPrinting(b.has_pos_printing || false);
      setHasCrmExport(b.has_crm_export || false);
      setHasCustomDomain(b.has_custom_domain || false);
      setHasFacturacionSri(b.has_facturacion_sri || false);
      setHasMermas(b.has_mermas || false);
      setPayphoneToken(b.payphone_token || '');
      setPayphoneAmbiente((b.payphone_ambiente as any) || 'pruebas');
      setLoading(false);
    }
    load();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !slug || !whatsapp) {
      setErrorMsg('Nombre, slug y WhatsApp son obligatorios.');
      return;
    }
    setIsSaving(true);
    setErrorMsg(null);
    setSavedOk(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('businesses').update({
        nombre,
        slug,
        ruc: ruc || null,
        telefono_whatsapp: whatsapp,
        direccion: direccion || null,
        plan,
        has_payphone: hasPayphone,
        has_live_kitchen: hasLiveKitchen,
        has_pos_printing: hasPosPrinting,
        has_crm_export: hasCrmExport,
        has_custom_domain: hasCustomDomain,
        has_facturacion_sri: hasFacturacionSri,
        has_mermas: hasMermas,
        payphone_token: hasPayphone && payphoneToken.trim() ? payphoneToken.trim() : null,
        payphone_ambiente: hasPayphone ? payphoneAmbiente : null,
      }).eq('id', id);

      if (error) {
        setErrorMsg(error.code === '23505'
          ? `El slug "/${slug}" ya existe en otra empresa.`
          : `Error: ${error.message}`);
        return;
      }
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPayphone = async () => {
    if (!payphoneToken.trim()) return;
    setTestingPayphone(true);
    setPayphoneTestResult(null);
    try {
      const res = await fetch('https://pay.payphonetodoesunchoice.com/api/button/V2/Prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${payphoneToken.trim()}` },
        body: JSON.stringify({ amount: 1, amountWithTax: 0, amountWithoutTax: 1, tax: 0, currency: 'USD', clientTransactionId: 'test-ping-000' }),
      });
      setPayphoneTestResult(res.status === 401 ? 'error' : 'ok');
    } catch {
      setPayphoneTestResult('error');
    } finally {
      setTestingPayphone(false);
    }
  };

  const handleEnterAsAdmin = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kaltiro_admin_business_id', id);
      sessionStorage.setItem('is_super_admin_impersonating', 'true');
    }
    router.push('/admin/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] gap-2 text-zinc-400 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin" /> Cargando empresa...
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center text-zinc-400 text-sm py-16">
        Empresa no encontrada. <Link href="/super-admin/dashboard" className="text-purple-400 underline">Volver</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/dashboard"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Link>
          <span className="text-zinc-700">/</span>
          <h1 className="text-sm font-semibold text-zinc-100">{business.nombre}</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border bg-purple-500/15 text-purple-300 border-purple-500/30">
            {plan.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${slug}`}
            target="_blank"
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Ver Catálogo
          </Link>
          <button
            type="button"
            onClick={handleEnterAsAdmin}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <LogIn className="w-3.5 h-3.5" /> Entrar como Admin
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {savedOk && (
        <div className="p-3.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Cambios guardados correctamente.
        </div>
      )}

      {/* 1. Datos Principales */}
      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
          <Building2 className="w-4 h-4 text-zinc-400" />
          <h2 className="font-semibold text-sm text-zinc-100">Datos del Negocio</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Nombre Comercial *</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Slug URL *</label>
            <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden focus-within:border-purple-500 transition-colors">
              <span className="px-3 text-xs text-zinc-500 bg-zinc-900 py-2.5 border-r border-zinc-800 shrink-0">kaltiro.com/</span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2.5 bg-transparent text-xs text-zinc-100 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">WhatsApp *</label>
            <input
              type="text"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">RUC</label>
            <input
              type="text"
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Dirección en Cuenca</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Plan de Suscripción</label>
            <CustomSelect
              options={planOptions}
              value={plan}
              onChange={(val) => setPlan(val as any)}
              accentColor="purple"
            />
          </div>
        </div>
      </div>

      {/* 2. Módulos Add-ons */}
      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h2 className="font-semibold text-sm text-zinc-100">Módulos & Add-ons</h2>
          <span className="text-[10px] text-zinc-500 ml-auto">Activa o desactiva por negocio</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* PayPhone */}
          <div
            className={`p-4 rounded-xl border transition-all space-y-1 ${hasPayphone ? 'bg-purple-950/30 border-purple-500/40' : 'bg-zinc-950 border-zinc-800'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className={`w-4 h-4 ${hasPayphone ? 'text-purple-400' : 'text-zinc-600'}`} />
                <span className="text-xs font-semibold text-zinc-200">PayPhone Tarjetas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono">+$9/m</span>
                <input
                  type="checkbox"
                  checked={hasPayphone}
                  onChange={(e) => { setHasPayphone(e.target.checked); setPayphoneTestResult(null); }}
                  className="rounded accent-purple-500 w-4 h-4"
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">Pago con tarjetas crédito/débito</p>
          </div>

          {/* KDS */}
          <div className={`p-4 rounded-xl border transition-all space-y-1 ${hasLiveKitchen ? 'bg-purple-950/30 border-purple-500/40' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className={`w-4 h-4 ${hasLiveKitchen ? 'text-purple-400' : 'text-zinc-600'}`} />
                <span className="text-xs font-semibold text-zinc-200">Monitor Cocina KDS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono">+$7/m</span>
                <input type="checkbox" checked={hasLiveKitchen} onChange={(e) => setHasLiveKitchen(e.target.checked)} className="rounded accent-purple-500 w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">Pantalla en tiempo real para cocina</p>
          </div>

          {/* POS Printing */}
          <div className={`p-4 rounded-xl border transition-all space-y-1 ${hasPosPrinting ? 'bg-purple-950/30 border-purple-500/40' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className={`w-4 h-4 ${hasPosPrinting ? 'text-purple-400' : 'text-zinc-600'}`} />
                <span className="text-xs font-semibold text-zinc-200">Impresión POS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono">+$7/m</span>
                <input type="checkbox" checked={hasPosPrinting} onChange={(e) => setHasPosPrinting(e.target.checked)} className="rounded accent-purple-500 w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">Tickets térmicos con QZ Tray</p>
          </div>

          {/* CRM */}
          <div className={`p-4 rounded-xl border transition-all space-y-1 ${hasCrmExport ? 'bg-purple-950/30 border-purple-500/40' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className={`w-4 h-4 ${hasCrmExport ? 'text-purple-400' : 'text-zinc-600'}`} />
                <span className="text-xs font-semibold text-zinc-200">Reportes & CRM</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono">+$5/m</span>
                <input type="checkbox" checked={hasCrmExport} onChange={(e) => setHasCrmExport(e.target.checked)} className="rounded accent-purple-500 w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">Exportación de clientes y ventas</p>
          </div>

          {/* SRI */}
          <div className={`p-4 rounded-xl border transition-all space-y-1 ${hasFacturacionSri ? 'bg-purple-950/30 border-purple-500/40' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className={`w-4 h-4 ${hasFacturacionSri ? 'text-purple-400' : 'text-zinc-600'}`} />
                <span className="text-xs font-semibold text-zinc-200">Facturación SRI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono">+$12/m</span>
                <input type="checkbox" checked={hasFacturacionSri} onChange={(e) => setHasFacturacionSri(e.target.checked)} className="rounded accent-purple-500 w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">Facturas electrónicas válidas Ecuador</p>
          </div>

          {/* Mermas */}
          <div className={`p-4 rounded-xl border transition-all space-y-1 ${hasMermas ? 'bg-purple-950/30 border-purple-500/40' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className={`w-4 h-4 ${hasMermas ? 'text-purple-400' : 'text-zinc-600'}`} />
                <span className="text-xs font-semibold text-zinc-200">Control de Stock</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono">+$7/m</span>
                <input type="checkbox" checked={hasMermas} onChange={(e) => setHasMermas(e.target.checked)} className="rounded accent-purple-500 w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">Bajas por daño, caducidad o pérdida</p>
          </div>
        </div>

        {/* PayPhone Config expandible */}
        {hasPayphone && (
          <div className="mt-2 p-5 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-semibold text-purple-300">Configuración PayPhone Ecuador</h3>
            </div>

            {/* Ambiente */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-2">Ambiente</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setPayphoneAmbiente('pruebas'); setPayphoneTestResult(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${payphoneAmbiente === 'pruebas' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                >
                  Pruebas (Sandbox)
                </button>
                <button
                  type="button"
                  onClick={() => { setPayphoneAmbiente('produccion'); setPayphoneTestResult(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${payphoneAmbiente === 'produccion' ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                >
                  Producción (Real)
                </button>
              </div>
            </div>

            {/* Token */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">Token JWT del Comercio</label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder="Token proporcionado por PayPhone Ecuador al comercio"
                  value={payphoneToken}
                  onChange={(e) => { setPayphoneToken(e.target.value); setPayphoneTestResult(null); }}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 font-mono focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Test */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestPayphone}
                disabled={testingPayphone || !payphoneToken.trim()}
                className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {testingPayphone
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Probando...</>
                  : <><CreditCard className="w-3.5 h-3.5" /> Probar conexión</>}
              </button>
              {payphoneTestResult === 'ok' && (
                <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Token válido — listo para activar
                </span>
              )}
              {payphoneTestResult === 'error' && (
                <span className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
                  <XCircle className="w-4 h-4" /> Token inválido o sin acceso
                </span>
              )}
            </div>

            <p className="text-[10px] text-zinc-500">
              El token se obtiene desde el portal de comercios de PayPhone Ecuador. Prueba siempre antes de activar producción.
            </p>
          </div>
        )}
      </div>

      {/* Guardar */}
      <div className="flex items-center justify-between gap-4 py-2">
        <Link
          href="/super-admin/dashboard"
          className="px-5 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-xs font-medium hover:bg-zinc-800 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-xl shadow-purple-500/20 flex items-center gap-2 transition-all border border-purple-400/30 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
}
