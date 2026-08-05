'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, PlusCircle, ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Verificar protección de autenticación para Super Admin
  useEffect(() => {
    if (pathname === '/super-admin/login') {
      setIsAuthenticated(true);
      return;
    }

    const isLogged = localStorage.getItem('super_admin_logged') === 'true' || document.cookie.includes('super_admin_session=true');

    if (!isLogged) {
      setIsAuthenticated(false);
      router.push('/super-admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('super_admin_logged');
    document.cookie = 'super_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/super-admin/login');
  };

  if (pathname === '/super-admin/login') {
    return <>{children}</>;
  }

  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070A11] text-white flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-purple-400 font-display text-sm">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          <span>Verificando permisos de Super Admin...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Gestión de Empresas', href: '/super-admin/dashboard', icon: Building2 },
    { label: 'Crear Nueva Empresa', href: '/super-admin/negocios/nuevo', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 font-sans flex flex-col md:flex-row w-full">
      {/* Sidebar Super Admin */}
      <aside className="w-full md:w-64 bg-[#0A0E1A] border-b md:border-b-0 md:border-r border-purple-500/20 p-5 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-6">
          {/* Logo Master */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold shadow-lg shadow-purple-500/10">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-sm text-white tracking-tight">Super Admin</h2>
              <span className="text-[10px] text-purple-400 font-mono-tech uppercase">Sesión Protegida</span>
            </div>
          </div>

          {/* Menú */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-display font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 border border-purple-400/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="pt-4 border-t border-slate-800 space-y-2 mt-6">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Ver Sitio Principal
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión Master
          </button>
        </div>
      </aside>

      {/* Contenido Principal Full Width */}
      <main className="flex-1 p-5 md:p-8 overflow-y-auto w-full min-w-0">
        {children}
      </main>
    </div>
  );
}
