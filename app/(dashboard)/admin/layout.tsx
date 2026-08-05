'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Package, Settings, LogOut, ExternalLink, Store, ShieldAlert } from 'lucide-react';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { business, loading } = useAdminBusiness();

  const navItems = [
    { label: 'Pedidos en Vivo', href: '/admin/dashboard', icon: ShoppingBag },
    { label: 'Productos y Catálogo', href: '/admin/productos', icon: Package },
    { label: 'Configuración Negocio', href: '/admin/configuracion', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row w-full">
      {/* Sidebar Desktop / Navbar Mobile */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-6">
          {/* Logo del Negocio Real de Supabase */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white truncate max-w-[140px]">
                {loading ? 'Cargando...' : business?.nombre || 'Mi Empresa'}
              </h2>
              <span className="inline-block text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Panel {business?.plan?.toUpperCase() || 'PRO'}
              </span>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
        <div className="pt-4 border-t border-slate-800 space-y-2 mt-4">
          {business?.slug && (
            <Link
              href={`/${business.slug}`}
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" /> Ver Catálogo Público
              </span>
            </Link>
          )}

          <Link
            href="/admin/login"
            className="flex items-center gap-2 px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </Link>
        </div>
      </aside>

      {/* Contenido Principal Full Width */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full min-w-0">
        {children}
      </main>
    </div>
  );
}
