'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';
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
    try {
      const raw = localStorage.getItem('kaltiro_admin_session');
      if (raw) {
        const s = JSON.parse(raw);
        if (s?.business?.slug) {
          router.replace(`/${s.business.slug}/app/dashboard`);
        }
      }
    } catch {
      localStorage.removeItem('kaltiro_admin_session');
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
      router.push(`/${data.session.business.slug}/app/dashboard`);
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#070A11] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-6">
        {/* Volver al inicio */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al inicio
        </Link>

        {/* Logo / Marca */}
        <div className="text-center space-y-3">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Bienvenido a Kaltiro</h1>
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
                <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@minegocio.ec"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-brand-500/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-brand-500/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98]"
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

        </div>

        {/* Registro */}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            ¿No tienes cuenta?{' '}
            <Link href="/app/registro" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </div>

        {/* Powered by */}
        <p className="text-center text-[10px] text-slate-700">
          Kaltiro.com — Software de Gestión para Restaurantes
        </p>
      </div>
    </div>
  );
}
