'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Plus, ExternalLink, Edit3, Trash2, X, Save, Search, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Business } from '@/lib/types/database';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function SuperAdminDashboardPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Edición
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editRuc, setEditRuc] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [editPlan, setEditPlan] = useState<'trial' | 'basico' | 'pro'>('pro');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar lista de negocios REALES desde Supabase Postgres DB
  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBusinesses(data as Business[]);
      }
    } catch (err) {
      console.error('Error en consulta de negocios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  const handleOpenEditModal = (b: Business) => {
    setErrorMsg(null);
    setEditingBusiness(b);
    setEditNombre(b.nombre);
    setEditSlug(b.slug);
    setEditRuc(b.ruc || '');
    setEditWhatsapp(b.telefono_whatsapp || '');
    setEditDireccion(b.direccion || '');
    setEditPlan(b.plan as any);
  };

  const handleSaveEditBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBusiness || !editNombre || !editSlug || !editWhatsapp) {
      setErrorMsg('Por favor completa el nombre, el slug y el WhatsApp.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('businesses')
        .update({
          nombre: editNombre,
          slug: editSlug,
          ruc: editRuc || null,
          telefono_whatsapp: editWhatsapp,
          direccion: editDireccion || null,
          plan: editPlan,
        })
        .eq('id', editingBusiness.id);

      if (error) {
        if (error.code === '23505') {
          setErrorMsg(`El slug "/${editSlug}" ya pertenece a otra empresa.`);
        } else {
          setErrorMsg(`Error guardando en Supabase: ${error.message}`);
        }
        setIsSaving(false);
        return;
      }

      setBusinesses((prev) =>
        prev.map((b) =>
          b.id === editingBusiness.id
            ? {
                ...b,
                nombre: editNombre,
                slug: editSlug,
                ruc: editRuc,
                telefono_whatsapp: editWhatsapp,
                direccion: editDireccion,
                plan: editPlan,
              }
            : b
        )
      );

      setEditingBusiness(null);
    } catch (err: any) {
      setErrorMsg(`Excepción: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBusiness = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar permanentemente la empresa "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from('businesses').delete().eq('id', id);

      if (!error) {
        setBusinesses((prev) => prev.filter((b) => b.id !== id));
      } else {
        alert(`Error al eliminar: ${error.message}`);
      }
    } catch (err: any) {
      alert(`Excepción: ${err.message}`);
    }
  };

  const filteredBusinesses = businesses.filter(
    (b) =>
      b.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const planBadges: Record<string, string> = {
    trial: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    basico: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    pro: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  const planOptions = [
    { value: 'trial', label: 'Trial (Prueba Gratuita 15 días)' },
    { value: 'basico', label: 'Plan Básico ($15/mes)' },
    { value: 'pro', label: 'Plan PRO ($29/mes - Recomendado)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-purple-500/20 shadow-xl">
        <div>
          <h1 className="text-2xl font-display font-black text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-purple-400" />
            <span>Gestión Master de Empresas (Tenants)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Administra los negocios registrados en Supabase, edita sus datos, planes de suscripción y accesos.
          </p>
        </div>

        <Link
          href="/super-admin/negocios/nuevo"
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-display font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all border border-purple-400/30 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nueva Empresa</span>
        </Link>
      </div>

      {/* Tarjetas de Métricas Globales del SaaS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-1">
          <span className="text-xs text-slate-400 font-display">Total Empresas Activas</span>
          <p className="text-3xl font-mono-tech font-black text-white">{businesses.length}</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-1">
          <span className="text-xs text-slate-400 font-display">Negocios en Plan PRO</span>
          <p className="text-3xl font-mono-tech font-black text-purple-400">
            {businesses.filter((b) => b.plan === 'pro').length}
          </p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-1">
          <span className="text-xs text-slate-400 font-display">Negocios en Trial / Básico</span>
          <p className="text-3xl font-mono-tech font-black text-emerald-400">
            {businesses.filter((b) => b.plan !== 'pro').length}
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Buscar por nombre o slug (ej. panaderia-cuenca)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Lista de Empresas */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-display text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
          <span>Cargando lista de empresas en tiempo real desde Supabase...</span>
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-3xl border border-slate-800 text-slate-400 font-display text-sm">
          No hay empresas registradas en este momento.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBusinesses.map((b) => (
            <div
              key={b.id}
              className="glass-card p-5 rounded-3xl border border-white/10 hover:border-purple-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
            >
              {/* Info Negocio */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-display font-black text-lg flex-shrink-0">
                  {b.nombre.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-extrabold text-base text-white">{b.nombre}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-tech font-bold uppercase border ${
                        planBadges[b.plan] || planBadges.trial
                      }`}
                    >
                      PLAN {b.plan}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono-tech mt-0.5">
                    Slug: <span className="text-purple-300">/{b.slug}</span> • Telf: {b.telefono_whatsapp}
                  </p>
                  {b.direccion && <p className="text-[11px] text-slate-500 mt-0.5">Dir: {b.direccion}</p>}
                </div>
              </div>

              {/* Acciones Rápidas del Super Admin */}
              <div className="flex items-center gap-2 self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                <button
                  onClick={() => handleOpenEditModal(b)}
                  className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-display font-bold border border-purple-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Empresa</span>
                </button>

                <Link
                  href={`/${b.slug}`}
                  target="_blank"
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-display font-bold border border-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Ver Catálogo</span>
                </Link>

                <button
                  onClick={() => handleDeleteBusiness(b.id, b.nombre)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                  title="Eliminar Empresa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Editar Empresa */}
      {editingBusiness && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-3xl border border-purple-500/30 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="font-display font-black text-white text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                <span>Editar Empresa: {editingBusiness.nombre}</span>
              </h3>
              <button
                onClick={() => setEditingBusiness(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveEditBusiness} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Slug URL *</label>
                  <input
                    type="text"
                    required
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono-tech"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">WhatsApp Notificaciones *</label>
                  <input
                    type="text"
                    required
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono-tech"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Plan de Suscripción</label>
                  <CustomSelect
                    options={planOptions}
                    value={editPlan}
                    onChange={(val) => setEditPlan(val as any)}
                    accentColor="purple"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">RUC del Negocio</label>
                  <input
                    type="text"
                    value={editRuc}
                    onChange={(e) => setEditRuc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono-tech"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Dirección en Cuenca</label>
                  <input
                    type="text"
                    value={editDireccion}
                    onChange={(e) => setEditDireccion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBusiness(null)}
                  className="flex-1 py-3 rounded-2xl border border-slate-700 text-slate-300 text-xs font-display font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-display font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
