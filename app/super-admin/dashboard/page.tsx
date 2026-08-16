'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Plus, ExternalLink, Edit3, Trash2, X, Search, RefreshCw, LogIn, AlertTriangle, CreditCard, Bell, Printer, Database, Globe, Receipt } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Business } from '@/lib/types/database';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingBusiness, setDeletingBusiness] = useState<Business | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setBusinesses(data as Business[]);
    } catch (err) {
      console.error('Error cargando empresas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBusinesses(); }, []);

  const handleEnterAsAdmin = (businessId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kaltiro_admin_business_id', businessId);
      sessionStorage.setItem('is_super_admin_impersonating', 'true');
    }
    router.push('/admin/dashboard');
  };

  const handleDeleteBusiness = async () => {
    if (!deletingBusiness) return;
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('businesses').delete().eq('id', deletingBusiness.id);
      if (!error) {
        setBusinesses((prev) => prev.filter((b) => b.id !== deletingBusiness.id));
        setDeletingBusiness(null);
      } else {
        setErrorMsg(`Error al eliminar: ${error.message}`);
      }
    } catch (err: any) {
      setErrorMsg(`Excepción: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBusinesses = businesses.filter(
    (b) =>
      b.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPlanLabel = (plan: string) => {
    if (plan === 'basico') return 'BASE';
    if (plan === 'trial') return 'TRIAL';
    return plan?.toUpperCase() || '—';
  };

  const getPlanColor = (plan: string) => {
    if (plan === 'basico') return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    if (plan === 'trial') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  };

  const getActiveModules = (b: Business) => {
    const mods = [];
    if (b.has_payphone) mods.push({ icon: CreditCard, label: 'PayPhone' });
    if (b.has_live_kitchen) mods.push({ icon: Bell, label: 'KDS' });
    if (b.has_pos_printing) mods.push({ icon: Printer, label: 'POS Print' });
    if (b.has_crm_export) mods.push({ icon: Database, label: 'CRM' });
    if (b.has_custom_domain) mods.push({ icon: Globe, label: 'Dominio' });
    if (b.has_facturacion_sri) mods.push({ icon: Receipt, label: 'SRI' });
    return mods;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900 border border-purple-500/20">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            <span>Gestión de Empresas</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Administra los negocios registrados, edita su configuración y accede a sus paneles.
          </p>
        </div>
        <Link
          href="/super-admin/negocios/nuevo"
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Empresa</span>
        </Link>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Total Empresas</span>
          <p className="text-2xl font-mono font-bold text-zinc-100">{businesses.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-purple-500/20 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Plan Base (activos)</span>
          <p className="text-2xl font-mono font-bold text-purple-400">
            {businesses.filter((b) => b.plan === 'basico').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-amber-500/20 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Trial / En evaluación</span>
          <p className="text-2xl font-mono font-bold text-amber-400">
            {businesses.filter((b) => b.plan !== 'basico').length}
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
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
        />
      </div>

      {/* Lista */}
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
          {filteredBusinesses.map((b) => {
            const mods = getActiveModules(b);
            return (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-sm flex-shrink-0">
                      {b.nombre.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-zinc-100">{b.nombre}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getPlanColor(b.plan)}`}>
                          {getPlanLabel(b.plan)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">/{b.slug} · {b.telefono_whatsapp}</p>
                      {b.direccion && <p className="text-[11px] text-zinc-500 mt-0.5">{b.direccion}</p>}

                      {/* Módulos activos */}
                      {mods.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {mods.map(({ icon: Icon, label }) => (
                            <span key={label} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-medium">
                              <Icon className="w-2.5 h-2.5" /> {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEnterAsAdmin(b.id)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Entrar</span>
                    </button>

                    <Link
                      href={`/super-admin/negocios/${b.id}`}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </Link>

                    <Link
                      href={`/${b.slug}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium border border-zinc-800 flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ver Catálogo</span>
                    </Link>

                    <button
                      onClick={() => setDeletingBusiness(b)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                      title="Eliminar Empresa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog Confirmar Eliminación */}
      {deletingBusiness && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-rose-500/30 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-zinc-100">Eliminar empresa</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <p className="text-xs text-zinc-300">
              ¿Estás seguro de eliminar permanentemente{' '}
              <strong className="text-white">{deletingBusiness.nombre}</strong>?
              Se perderán todos sus datos, productos y pedidos.
            </p>
            {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setDeletingBusiness(null); setErrorMsg(null); }}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteBusiness}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
