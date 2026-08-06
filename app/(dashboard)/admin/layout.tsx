'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Package, Settings, LogOut, ExternalLink, Store, ShieldAlert, Palette } from 'lucide-react';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { business, loading } = useAdminBusiness();
  const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLogged = localStorage.getItem('super_admin_logged') === 'true' || document.cookie.includes('super_admin_session=true');
      setIsSuperAdmin(isLogged);
    }
  }, []);

  const navItems = [
    { label: 'Pedidos en Vivo', href: '/admin/dashboard', icon: ShoppingBag },
    { label: 'Productos y Categorías', href: '/admin/productos', icon: Package },
    { label: 'Apariencia & Branding', href: '/admin/apariencia', icon: Palette },
    { label: 'Configuración Negocio', href: '/admin/configuracion', icon: Settings },
  ];

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#070A11] text-slate-100 font-sans flex flex-col md:flex-row w-full">
      {/* Sidebar Fija Desktop / Navbar Mobile (Estilo Arc Browser / Linear) */}
      <aside className="w-full md:w-64 md:h-screen bg-[#0B0F1B] border-b md:border-b-0 md:border-r border-white/10 p-5 flex flex-col justify-between flex-shrink-0 overflow-y-auto">
        <div className="space-y-6">
          {/* Logo e Identidad del Negocio */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-lg flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-black text-sm text-white truncate">
                {loading ? 'Cargando...' : business?.nombre || 'Mi Empresa'}
              </h2>
              <span className="inline-block text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Panel {business?.plan?.toUpperCase() || 'PRO'}
              </span>
            </div>
          </div>

          {/* Menú de Navegación Nivel Producción */}
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
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 border border-emerald-400/30'
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

        {/* Acciones Secundarias */}
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

          {business?.slug && (
            <Link
              href={`/${business.slug}`}
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-display font-medium border border-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" /> Ver Catálogo Público
              </span>
            </Link>
          )}

          <Link
            href="/admin/login"
            className="flex items-center gap-2 px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-display font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </Link>
        </div>
      </aside>

      {/* Contenido Principal con Scroll Independiente */}
      <main className="flex-1 h-full overflow-y-auto p-5 md:p-8 w-full min-w-0">
        {children}
      </main>
    </div>
  );
}
