'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, PlusCircle, ShieldAlert, LogOut, ArrowLeft, Menu, X, Receipt } from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  useEffect(() => { setIsSidebarOpen(false); }, [pathname]);

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
    { label: 'Facturación', href: '/super-admin/facturacion', icon: Receipt },
    { label: 'Crear Nueva Empresa', href: '/super-admin/negocios/nuevo', icon: PlusCircle },
  ];

  return (
    <div className="h-screen bg-[#070A11] text-slate-100 font-sans flex flex-col md:flex-row w-full overflow-hidden">

      {/* Header móvil */}
      <header className="md:hidden w-full h-14 bg-[#0A0E1A] border-b border-purple-500/20 flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="font-display font-black text-xs text-white">Super Admin</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white"
        >
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </header>

      {/* Backdrop móvil */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40" />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 h-full bg-[#0A0E1A] border-r border-purple-500/20 p-5 flex flex-col justify-between flex-shrink-0 z-50 transition-transform duration-300 ease-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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

      {/* Contenido Principal */}
      <main className="flex-1 h-full overflow-y-auto p-5 md:p-8 w-full min-w-0">
        {children}
      </main>
    </div>
  );
}
