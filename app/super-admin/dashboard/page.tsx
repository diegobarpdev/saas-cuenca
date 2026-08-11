'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Plus, ExternalLink, Edit3, Trash2, X, Save, Search, RefreshCw, LogIn, CreditCard, Bell, Printer, Database, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Business } from '@/lib/types/database';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
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
  const [editPlan, setEditPlan] = useState<'trial' | 'basico'>('basico');
  const [editHasPayphone, setEditHasPayphone] = useState(false);
  const [editHasLiveKitchen, setEditHasLiveKitchen] = useState(false);
  const [editHasPosPrinting, setEditHasPosPrinting] = useState(false);
  const [editHasCrmExport, setEditHasCrmExport] = useState(false);
  const [editHasCustomDomain, setEditHasCustomDomain] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      console.error('Error cargando empresas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  const handleEnterAsAdmin = (businessId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kaltiro_admin_business_id', businessId);
      sessionStorage.setItem('is_super_admin_impersonating', 'true');
    }
    router.push('/admin/dashboard');
  };

  const handleOpenEditModal = (b: Business) => {
    setErrorMsg(null);
    setEditingBusiness(b);
    setEditNombre(b.nombre);
    setEditSlug(b.slug);
    setEditRuc(b.ruc || '');
    setEditWhatsapp(b.telefono_whatsapp || '');
    setEditDireccion(b.direccion || '');
    setEditPlan((b.plan as any) === 'basico' ? 'basico' : 'trial');
    setEditHasPayphone(b.has_payphone || false);
    setEditHasLiveKitchen(b.has_live_kitchen || false);
    setEditHasPosPrinting(b.has_pos_printing || false);
    setEditHasCrmExport(b.has_crm_export || false);
    setEditHasCustomDomain(b.has_custom_domain || false);
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
          has_payphone: editHasPayphone,
          has_live_kitchen: editHasLiveKitchen,
          has_pos_printing: editHasPosPrinting,
          has_crm_export: editHasCrmExport,
          has_custom_domain: editHasCustomDomain,
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

  const planOptions = [
    { value: 'basico', label: 'Plan Base Core ($15/mes)' },
    { value: 'trial', label: 'Trial — Prueba Gratuita 14 días' },
  ];

  // Helpers de plan
  const getPlanLabel = (plan: string) => {
    if (plan === 'basico') return 'BASE';
    if (plan === 'trial') return 'TRIAL';
    return plan?.toUpperCase() || '—';
  };
  const getPlanColor = (plan: string) => {
    if (plan === 'basico') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (plan === 'trial') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Producción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-zinc-400" />
            <span>Gestión de Empresas (Tenants)</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Administra los negocios registrados en la plataforma, edita sus configuraciones y accede a sus paneles.
          </p>
        </div>

        <Link
          href="/super-admin/negocios/nuevo"
          className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Empresa</span>
        </Link>
      </div>

      {/* Métricas limpias */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Total Empresas Registradas</span>
          <p className="text-2xl font-mono font-bold text-zinc-100">{businesses.length}</p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/40 border border-emerald-900/40 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Plan Base Core (activos)</span>
          <p className="text-2xl font-mono font-bold text-emerald-400">
            {businesses.filter((b) => b.plan === 'basico').length}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/40 border border-amber-900/40 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Trial / En evaluación</span>
          <p className="text-2xl font-mono font-bold text-amber-400">
            {businesses.filter((b) => b.plan === 'trial' || b.plan !== 'basico').length}
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Buscar por nombre o slug..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
        />
      </div>

      {/* Lista de Empresas */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Cargando empresas...</span>
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-zinc-800/80 bg-zinc-900/30 text-zinc-400 text-xs">
          No hay empresas registradas.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBusinesses.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Información */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200 font-bold text-sm flex-shrink-0">
                  {b.nombre.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-zinc-100">{b.nombre}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getPlanColor(b.plan)}`}>
                      {getPlanLabel(b.plan)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    /{b.slug} • Telf: {b.telefono_whatsapp}
                  </p>
                  {b.direccion && <p className="text-[11px] text-zinc-500 mt-0.5">Dir: {b.direccion}</p>}
                </div>
              </div>

              {/* Botones de Acción Estándar */}
              <div className="flex flex-wrap items-center gap-2 self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                <button
                  onClick={() => handleEnterAsAdmin(b.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                  title="Entrar al panel de control de esta empresa"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Entrar con Admin</span>
                </button>

                <button
                  onClick={() => handleOpenEditModal(b)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                <Link
                  href={`/${b.slug}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium border border-zinc-800 flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ver Catálogo</span>
                </Link>

                <button
                  onClick={() => handleDeleteBusiness(b.id, b.nombre)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                  title="Eliminar Empresa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Editar Empresa */}
      {editingBusiness && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-zinc-400" />
                <span>Editar Empresa: {editingBusiness.nombre}</span>
              </h3>
              <button
                onClick={() => setEditingBusiness(null)}
                className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveEditBusiness} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Slug URL *</label>
                  <input
                    type="text"
                    required
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">WhatsApp Notificaciones *</label>
                  <input
                    type="text"
                    required
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Plan de Suscripción</label>
                  <CustomSelect
                    options={planOptions}
                    value={editPlan}
                    onChange={(val) => setEditPlan(val as any)}
                    accentColor="emerald"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {editPlan === 'basico' ? 'Pago mensual activo — $15/mes base.' : 'En período de prueba gratuita.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">RUC del Negocio</label>
                  <input
                    type="text"
                    value={editRuc}
                    onChange={(e) => setEditRuc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Dirección en Cuenca</label>
                  <input
                    type="text"
                    value={editDireccion}
                    onChange={(e) => setEditDireccion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                  />
                </div>
              </div>

              {/* Módulos Add-ons Habilitados */}
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <label className="block text-xs font-semibold text-emerald-400">Módulos & Add-ons Habilitados</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                  <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 p-2 rounded-lg border border-zinc-800 hover:border-zinc-700">
                    <input
                      type="checkbox"
                      checked={editHasPayphone}
                      onChange={(e) => setEditHasPayphone(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-emerald-400" /> PayPhone Tarjetas (+$9/m)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 p-2 rounded-lg border border-zinc-800 hover:border-zinc-700">
                    <input
                      type="checkbox"
                      checked={editHasLiveKitchen}
                      onChange={(e) => setEditHasLiveKitchen(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-emerald-400" /> Monitor Cocina KDS (+$7/m)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 p-2 rounded-lg border border-zinc-800 hover:border-zinc-700">
                    <input
                      type="checkbox"
                      checked={editHasPosPrinting}
                      onChange={(e) => setEditHasPosPrinting(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span className="flex items-center gap-1.5"><Printer className="w-3.5 h-3.5 text-emerald-400" /> Impresión POS (+$7/m)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 p-2 rounded-lg border border-zinc-800 hover:border-zinc-700">
                    <input
                      type="checkbox"
                      checked={editHasCrmExport}
                      onChange={(e) => setEditHasCrmExport(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-emerald-400" /> Reportes & CRM (+$5/m)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={editHasCustomDomain}
                      onChange={(e) => setEditHasCustomDomain(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-emerald-400" /> Dominio Personalizado (+$9/m)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBusiness(null)}
                  className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-xs font-medium hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
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
