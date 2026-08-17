'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Zap, ArrowRight, ArrowLeft, Eye, EyeOff, User, Mail, Lock, XCircle, CheckCircle2 } from 'lucide-react';

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const hasLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const strength = [hasLength, hasLetter, hasNumber].filter(Boolean).length;
  const bar = ['bg-red-500', 'bg-yellow-500', 'bg-emerald-500'][strength - 1] ?? 'bg-slate-700';
  const label = ['Muy débil', 'Regular', 'Segura'][strength - 1] ?? '';
  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? bar : 'bg-white/10'}`} />
        ))}
      </div>
      <div className="flex gap-3 text-[10px] text-slate-500">
        <span className={hasLength ? 'text-emerald-400' : ''}>8+ caracteres</span>
        <span className={hasLetter ? 'text-emerald-400' : ''}>letra</span>
        <span className={hasNumber ? 'text-emerald-400' : ''}>número</span>
        {label && <span className="ml-auto font-semibold">{label}</span>}
      </div>
    </div>
  );
}

export default function RegistroPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (honeypot) return;

    if (!nombre.trim() || nombre.trim().length < 2) {
      setError('Tu nombre debe tener al menos 2 caracteres');
      return;
    }
    const emailLower = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      setError('Correo electrónico inválido');
      return;
    }
    if (!password || password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setError('La contraseña debe tener al menos 8 caracteres, una letra y un número');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_admin: nombre.trim(), email: emailLower, password, honeypot }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Error al crear la cuenta');
        setLoading(false);
        return;
      }
      setSentEmail(emailLower);
      setSent(true);
    } catch {
      setError('Error de conexión. Intenta nuevamente.');
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#070A11] text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-brand-500/5 blur-3xl" />
        </div>
        <div className="relative w-full max-w-sm text-center space-y-6">
          <div className="bg-[#0D1220]/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-xl font-black text-white">Revisa tu correo</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enviamos un link de confirmación a{' '}
              <span className="text-white font-semibold">{sentEmail}</span>.
              Haz clic en el link para continuar con el registro de tu negocio.
            </p>
            <p className="text-[11px] text-slate-600">
              ¿No lo ves? Revisa tu carpeta de spam.
            </p>
          </div>
          <Link href="/app/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A11] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-6 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al inicio
        </Link>

        <div className="text-center">
          <h1 className="text-2xl font-black text-white tracking-tight">Crea tu cuenta</h1>
          <p className="text-xs text-slate-500 mt-1">7 días de prueba · Sin tarjeta de crédito</p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-brand-500 text-slate-950 text-[10px] font-black flex items-center justify-center">1</div>
            <span className="text-xs font-semibold text-white">Tu cuenta</span>
          </div>
          <div className="flex-1 h-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-white/10 text-slate-500 text-[10px] font-black flex items-center justify-center">2</div>
            <span className="text-xs text-slate-500">Tu negocio</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0D1220]/80 backdrop-blur-md border border-white/10 rounded-3xl p-7 shadow-2xl space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <input type="text" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} aria-hidden="true" autoComplete="off" style={{ display: 'none' }} />

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tu nombre</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="text" required placeholder="Juan Pérez" value={nombre} onChange={e => setNombre(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-brand-500/60 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Correo electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="email" required placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-brand-500/60 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type={showPassword ? 'text' : 'password'} required placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-brand-500/60 transition-colors" />
              <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Confirmar contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type={showPassword ? 'text' : 'password'} required placeholder="Repite la contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070A11] border text-sm text-white placeholder-slate-700 focus:outline-none transition-colors ${
                  confirmPassword && password !== confirmPassword ? 'border-rose-500/50'
                  : confirmPassword && password === confirmPassword ? 'border-emerald-500/50'
                  : 'border-white/10 focus:border-brand-500/60'}`} />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[10px] text-rose-400 mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98] mt-2">
            {loading ? 'Enviando...' : <><span>Continuar</span><ArrowRight className="w-4 h-4" /></>}
          </button>

          <p className="text-[10px] text-slate-600 text-center leading-relaxed">
            Al continuar aceptas los términos de servicio de Kaltiro.
          </p>
        </form>

        <div className="text-center">
          <p className="text-xs text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/app/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">Ingresar</Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-700">
          Kaltiro.com — Software de Gestión para Restaurantes
        </p>
      </div>
    </div>
  );
}
