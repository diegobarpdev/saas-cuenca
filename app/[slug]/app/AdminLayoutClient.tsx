'use client';

import React, { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, Package, Settings, LogOut, ExternalLink, Store, ShieldAlert, Palette, ShoppingCart, Menu, X, Tv, TrendingUp, Receipt, Boxes } from 'lucide-react';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function AdminLayoutClient({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const pathname = usePathname();
  const router = useRouter();
  const { business, loading } = useAdminBusiness(slug);
  const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [simulatedRole, setSimulatedRole] = React.useState<'dueño' | 'cajero-1' | 'cajero-2' | 'cocinero'>('dueño');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSuperAdmin(sessionStorage.getItem('is_super_admin_impersonating') === 'true');
      const role = localStorage.getItem('kaltiro_simulated_role') as any;
      if (role) setSimulatedRole(role);
    }
  }, []);

  React.useEffect(() => { setIsSidebarOpen(false); }, [pathname]);

  const handleSwitchRole = (newRole: 'dueño' | 'cajero-1' | 'cajero-2' | 'cocinero') => {
    setSimulatedRole(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kaltiro_simulated_role', newRole);
      if (newRole === 'cocinero') {
        window.location.href = `/${slug}/cocina`;
      } else if (newRole.startsWith('cajero')) {
        window.location.href = `/${slug}/caja`;
      } else {
        window.location.href = `/${slug}/app/dashboard`;
      }
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kaltiro_admin_session');
      localStorage.removeItem('kaltiro_admin_business_id');
      router.push('/app/login');
    }
  };

  const navItems = [
    { label: 'Dashboard & Analíticas',    href: `/${slug}/app/dashboard`,      icon: TrendingUp,  roles: ['dueño'],                           show: true },
    { label: 'Caja POS (Toma & Pedidos)', href: `/${slug}/caja`,                 icon: Store,       roles: ['dueño', 'cajero-1', 'cajero-2'],   show: true },
    { label: 'Monitor Cocina KDS',        href: `/${slug}/cocina`,               icon: Tv,          roles: ['dueño', 'cocinero'],                show: true },
    { label: 'Productos y Categorías',    href: `/${slug}/app/productos`,       icon: Package,     roles: ['dueño'],                           show: true },
    { label: 'Apariencia & Branding',     href: `/${slug}/app/apariencia`,     icon: Palette,     roles: ['dueño'],                           show: true },
    { label: 'Facturas',                  href: `/${slug}/app/facturacion`,    icon: Receipt,     roles: ['dueño'],                           show: !!business?.has_facturacion_sri },
    { label: 'Control de Stock',           href: `/${slug}/app/mermas`,         icon: Boxes,       roles: ['dueño'],                           show: !!business?.has_mermas },
    { label: 'Marketplace Add-ons',       href: `/${slug}/app/marketplace`,    icon: ShoppingCart,roles: ['dueño'],                           show: true },
    { label: 'Configuración Negocio',     href: `/${slug}/app/configuracion`,  icon: Settings,    roles: ['dueño'],                           show: true },
  ].filter((item) => item.roles.includes(simulatedRole) && item.show);

  // Verificar si el trial expiró
  const trialExpired = (() => {
    if (!business || business.plan !== 'trial') return false;
    const created = new Date(business.created_at);
    const expires = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
    return new Date() > expires;
  })();

  if (trialExpired) {
    return (
      <div className="min-h-screen bg-[#070A11] text-white flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-brand-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Tu período de prueba terminó</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Los 7 días de prueba de <span className="text-white font-semibold">{business?.nombre}</span> han finalizado.
              Contáctanos para activar tu plan y seguir recibiendo pedidos.
            </p>
          </div>
          <a
            href={`https://wa.me/593${process.env.NEXT_PUBLIC_SOPORTE_WA ?? ''}?text=${encodeURIComponent(`Hola, quiero activar mi plan en Kaltiro para el negocio ${business?.nombre} (/${slug})`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm transition-all active:scale-95 shadow-lg shadow-brand-500/20"
          >
            Activar mi plan →
          </a>
          <button onClick={handleLogout} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#070A11] text-slate-100 font-sans flex flex-col md:flex-row w-full relative">

      {/* Header móvil */}
      <header className="md:hidden w-full h-16 bg-[#0B0F1B] border-b border-white/10 flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 flex-shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-black text-xs text-white truncate max-w-[150px]">
              {loading ? 'Cargando...' : business?.nombre || 'Mi Empresa'}
            </h2>
            <span className="text-[9px] text-brand-400 font-mono font-bold block leading-none">
              {business?.plan?.toUpperCase() || 'TRIAL'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Backdrop móvil */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="md:hidden fixed inset-0 bg-black/85 backdrop-blur-sm z-40" />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-72 md:w-64 h-full bg-[#0B0F1B] border-r border-white/10 p-5 flex flex-col justify-between shrink-0 z-50 transition-transform duration-300 ease-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold shadow-lg flex-shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display font-black text-sm text-white truncate max-w-[140px]">
                  {loading ? 'Cargando...' : business?.nombre || 'Mi Empresa'}
                </h2>
                <span className="inline-block text-[10px] text-brand-400 font-mono font-bold bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                  Panel {business?.plan?.toUpperCase() || 'TRIAL'}
                </span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-display font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20 border border-brand-400/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-white/10 space-y-2 mt-6">
          {isSuperAdmin && (
            <Link
              href="/super-admin/dashboard"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 text-xs font-display font-bold border border-purple-500/30 transition-all shadow-md"
            >
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span>Volver a Super Admin</span>
            </Link>
          )}

          {slug && (
            <Link
              href={`/${slug}`}
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-display font-medium border border-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-brand-400" /> Ver Catálogo Público
              </span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-display font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>

          {(isSuperAdmin || slug === 'demo') && (
            <div className="pt-4 border-t border-white/10 mt-3.5 space-y-2">
              <label className="block text-[9px] font-mono-tech font-bold uppercase tracking-wider text-amber-400">
                ⚡ Simulador de Roles
              </label>
              <CustomSelect
                options={[
                  { value: 'dueño', label: 'Dueño / Admin' },
                  { value: 'cajero-1', label: 'Cajero 1 (Principal)' },
                  { value: 'cajero-2', label: 'Cajero 2 (Barra)' },
                  { value: 'cocinero', label: 'Cocinero (KDS)' },
                ]}
                value={simulatedRole}
                onChange={(val) => handleSwitchRole(val as any)}
                accentColor="amber"
                className="text-xs"
              />
            </div>
          )}

          <div className="pt-4 border-t border-white/10 mt-3.5 flex items-center justify-center gap-1.5 opacity-50">
            <Image src="/assets/KALTIRO_FONDO_PRINCIPAL.png" alt="Kaltiro" width={14} height={14} className="rounded-sm object-contain" />
            <span className="text-[9px] font-mono-tech font-medium text-slate-400">Kaltiro.com</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 md:p-8 w-full min-w-0">
        {children}
      </main>
    </div>
  );
}
