'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Building2, CreditCard, MapPin, Phone, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { createClient } from '@/lib/supabase/client';

export default function AdminSettingsPage() {
  const { business, loading } = useAdminBusiness();

  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');
  const [direccion, setDireccion] = useState('');
  
  // Datos bancarios Deuna / Pichincha
  const [banco, setBanco] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [titular, setTitular] = useState('');
  const [payphoneToken, setPayphoneToken] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (business) {
      setNombre(business.nombre);
      setRuc(business.ruc || '');
      setTelefonoWhatsapp(business.telefono_whatsapp || '');
      setDireccion(business.direccion || '');
      if (business.datos_bancarios) {
        setBanco(business.datos_bancarios.banco || 'Banco Pichincha');
        setTipoCuenta(business.datos_bancarios.tipo_cuenta || 'Ahorros');
        setNumeroCuenta(business.datos_bancarios.numero_cuenta || '');
        setTitular(business.datos_bancarios.titular || '');
      }
      setPayphoneToken(business.payphone_token || '');
    }
  }, [business]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    setIsSaving(true);
    setSuccessMsg(false);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('businesses')
        .update({
          nombre,
          ruc,
          telefono_whatsapp: telefonoWhatsapp,
          direccion,
          payphone_token: payphoneToken || null,
          datos_bancarios: {
            banco,
            tipo_cuenta: tipoCuenta,
            numero_cuenta: numeroCuenta,
            titular,
            ruc_ci: ruc,
            email: '',
          },
        })
        .eq('id', business.id);

      if (!error) {
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 3000);
      }
    } catch (err) {
      console.error('Error guardando configuración:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !business) {
    return (
      <div className="p-12 text-center text-slate-400 font-display text-sm flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
        <span>Cargando datos de configuración desde Supabase...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D1322] p-5 rounded-3xl border border-white/10 glass-panel">
        <div>
          <h1 className="text-xl font-display font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-emerald-400" />
            <span>Configuración de Empresa — {business.nombre}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Actualiza datos comerciales, cuentas para Deuna! y tokens de pasarela de pago PayPhone Ecuador.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-display font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>¡Configuración guardada exitosamente en la base de datos de Supabase!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. Perfil del Negocio */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <h2 className="font-display font-black text-sm text-emerald-400 uppercase tracking-wider">
            1. Datos Comerciales del Negocio
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Nombre Comercial</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">RUC del Negocio</label>
              <input
                type="text"
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-mono-tech"
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
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-mono-tech"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Dirección del Local en Cuenca</label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
          </div>
        </div>

        {/* 2. Datos Bancarios Deuna / Pichincha */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <h2 className="font-display font-black text-sm text-amber-400 uppercase tracking-wider">
            2. Datos para Deuna! & Transferencia Bancaria
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Banco</label>
              <input
                type="text"
                value={banco}
                onChange={(e) => setBanco(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Tipo de Cuenta</label>
              <input
                type="text"
                value={tipoCuenta}
                onChange={(e) => setTipoCuenta(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Nro. de Cuenta</label>
              <input
                type="text"
                value={numeroCuenta}
                onChange={(e) => setNumeroCuenta(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-mono-tech"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Titular de la Cuenta</label>
              <input
                type="text"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-display font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Guardando en Supabase DB...' : 'Guardar Cambios de Configuración'}</span>
        </button>
      </form>
    </div>
  );
}
