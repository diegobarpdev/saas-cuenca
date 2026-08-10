'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Zap } from 'lucide-react';
import { saveSession } from '@/hooks/useAdminSession';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Si ya hay sesión activa, redirigir directo al dashboard
  useEffect(() => {
    const raw = localStorage.getItem('yapi_admin_session');
    if (raw) {
      router.replace('/admin/dashboard');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Correo o contraseña incorrectos');
        setLoading(false);
        return;
      }

      // Guardar sesión y redirigir
      saveSession(data.session);
      sessionStorage.removeItem('is_super_admin_impersonating');
      router.push('/admin/dashboard');
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@yapiec.com');
    setPassword('demo1234');
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@yapiec.com', password: 'demo1234' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Error al ingresar con cuenta demo');
        setLoading(false);
        return;
      }
      saveSession(data.session);
      router.push('/admin/dashboard');
    } catch {
      setError('Error de conexión.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-6">
        {/* Logo / Marca */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <Zap className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Bienvenido a Yapi</h1>
            <p className="text-xs text-slate-500 mt-1">
              Ingresa con las credenciales de tu negocio
            </p>
          </div>
        </div>

        {/* Card del formulario */}
        <div className="bg-[#0D1220]/80 backdrop-blur-md border border-white/10 rounded-3xl p-7 shadow-2xl space-y-5">
          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="admin@minegocio.ec"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-2.5 text-slate-600 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Verificando...
                </span>
              ) : (
                <>
                  <span>Ingresar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-slate-600 font-medium">O PRUEBA CON</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Botón demo */}
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Zap className="w-3.5 h-3.5" />
            Acceder con cuenta Demo
          </button>
        </div>

        {/* Powered by */}
        <p className="text-center text-[10px] text-slate-700">
          Yapi.ec — Software de Gestión para Restaurantes
        </p>
      </div>
    </div>
  );
}
