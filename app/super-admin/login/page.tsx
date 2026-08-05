'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock, User, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validación de usuario Master Super Admin
    setTimeout(() => {
      // Credenciales por defecto para desarrollo/producción inicial
      const VALID_USER = 'admin';
      const VALID_PASS = 'cuenca2026';

      if (
        (username.trim().toLowerCase() === VALID_USER || username.trim().toLowerCase() === 'admin@pedidoscuenca.ec') &&
        password === VALID_PASS
      ) {
        // Guardar la cookie/session del Super Admin
        document.cookie = 'super_admin_session=true; path=/; max-age=86400';
        localStorage.setItem('super_admin_logged', 'true');
        setLoading(false);
        router.push('/super-admin/dashboard');
      } else {
        setLoading(false);
        setError('Usuario o contraseña master incorrectos.');
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Glow Ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-purple-500/20 shadow-2xl space-y-6 relative z-10">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono-tech">
            <Sparkles className="w-3.5 h-3.5" /> Acceso Protegido Super Admin
          </span>
          <h1 className="text-2xl font-display font-black text-white tracking-tight">Login Master Platform</h1>
          <p className="text-xs text-slate-400">
            Ingresa tu usuario y clave master para gestionar el SaaS.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Usuario Super Admin</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Contraseña Master</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20 active:scale-98 transition-all"
          >
            <span>{loading ? 'Verificando...' : 'Iniciar Sesión Master'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p className="font-bold text-purple-300">Credenciales por defecto:</p>
          <p>Usuario: <strong className="text-white">admin</strong></p>
          <p>Contraseña: <strong className="text-white">cuenca2026</strong></p>
        </div>
      </div>
    </div>
  );
}
