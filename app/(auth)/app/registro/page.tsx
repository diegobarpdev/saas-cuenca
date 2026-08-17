'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap, ArrowRight, ArrowLeft, Eye, EyeOff, Building2,
  User, Mail, Lock, Phone, CheckCircle2, XCircle, Loader2, Globe,
} from 'lucide-react';
import { saveSession } from '@/hooks/useAdminSession';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

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
  const router = useRouter();

  // Campos del formulario
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [nombreAdmin, setNombreAdmin] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [honeypot, setHoneypot] = useState(''); // campo trampa anti-bot

  // Estado UI
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Auto-generar slug desde nombre del negocio
  useEffect(() => {
    if (slugManual) return;
    const generated = slugify(nombreNegocio);
    setSlug(generated);
    if (generated.length >= 3) checkSlug(generated);
    else setSlugStatus('idle');
  }, [nombreNegocio, slugManual]);

  // Verificar disponibilidad del slug (debounced)
  const checkSlug = useCallback(
    debounce(async (s: string) => {
      if (!s || s.length < 3) { setSlugStatus('idle'); return; }
      setSlugStatus('checking');
      try {
        const res = await fetch(`/api/registro?slug=${encodeURIComponent(s)}`);
        const data = await res.json();
        setSlugStatus(data.available ? 'available' : 'taken');
        setSlug(data.slug); // normalizado desde el servidor
      } catch {
        setSlugStatus('idle');
      }
    }, 500),
    []
  );

  const handleSlugChange = (val: string) => {
    setSlugManual(true);
    setSlug(val);
    const clean = slugify(val);
    checkSlug(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones cliente
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (slugStatus === 'taken') {
      setError('La URL del negocio ya está en uso');
      return;
    }
    if (slug.length < 3) {
      setError('La URL debe tener al menos 3 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_negocio: nombreNegocio,
          slug_raw: slug,
          nombre_admin: nombreAdmin,
          email,
          password,
          telefono,
          honeypot,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Error al crear la cuenta');
        setLoading(false);
        return;
      }

      setSuccess(true);
      saveSession(data.session);
      setTimeout(() => {
        router.push(`/${data.slug}/app/dashboard`);
      }, 1500);
    } catch {
      setError('Error de conexión. Intenta nuevamente.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#070A11] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-black text-white">¡Cuenta creada!</h2>
          <p className="text-slate-400 text-sm">Redirigiendo a tu panel...</p>
          <Loader2 className="w-5 h-5 text-brand-400 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const slugOk = slugStatus === 'available';
  const slugBad = slugStatus === 'taken';

  return (
    <div className="min-h-screen bg-[#070A11] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-6 py-8">
        {/* Volver al inicio */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al inicio
        </Link>

        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 border border-brand-500/30 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/10">
            <Zap className="w-7 h-7 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Crea tu cuenta gratis</h1>
            <p className="text-xs text-slate-500 mt-1">14 días de prueba · Sin tarjeta de crédito</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-[#0D1220]/80 backdrop-blur-md border border-white/10 rounded-3xl p-7 shadow-2xl space-y-5">

          {/* Error global */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Honeypot — oculto para humanos, trampa para bots */}
          <input
            type="text"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            style={{ display: 'none' }}
          />

          {/* ── Sección: Negocio ───────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Datos del negocio
            </p>
            <div className="space-y-3">

              {/* Nombre del negocio */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nombre del negocio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Café El Sagrario"
                  value={nombreNegocio}
                  onChange={e => setNombreNegocio(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-brand-500/60 transition-colors"
                />
              </div>

              {/* Slug / URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  URL de tu catálogo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-600 text-xs font-mono pointer-events-none">
                    kaltiro.com/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="mi-negocio"
                    value={slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    className={`w-full pl-28 pr-9 py-2.5 rounded-xl bg-[#070A11] border text-sm text-white placeholder-slate-700 font-mono focus:outline-none transition-colors ${
                      slugOk ? 'border-emerald-500/50' : slugBad ? 'border-rose-500/50' : 'border-white/10 focus:border-brand-500/60'
                    }`}
                  />
                  <span className="absolute right-3 top-2.5">
                    {slugStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />}
                    {slugOk && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {slugBad && <XCircle className="w-4 h-4 text-rose-400" />}
                  </span>
                </div>
                {slugOk && <p className="text-[10px] text-emerald-400 mt-1">✓ Disponible</p>}
                {slugBad && <p className="text-[10px] text-rose-400 mt-1">✗ Ya está en uso — elige otro</p>}
                {!slugOk && !slugBad && slug && slug.length >= 3 && (
                  <p className="text-[10px] text-slate-600 mt-1">Tus clientes entrarán en esta URL</p>
                )}
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">WhatsApp del negocio</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-600 absolute left-3.5 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="593987654321"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white font-mono placeholder-slate-700 focus:outline-none focus:border-brand-500/60 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-slate-600 mt-1">Número con código de país: 593 + número</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/[0.06]" />

          {/* ── Sección: Cuenta ────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Tu cuenta de administrador
            </p>
            <div className="space-y-3">

              {/* Nombre admin */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tu nombre</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-600 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Juan Pérez"
                    value={nombreAdmin}
                    onChange={e => setNombreAdmin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-brand-500/60 transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Correo electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="admin@minegocio.ec"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-brand-500/60 transition-colors"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-600 absolute left-3.5 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-brand-500/60 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 text-slate-600 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-600 absolute left-3.5 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070A11] border text-sm text-white placeholder-slate-700 focus:outline-none transition-colors ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-rose-500/50'
                        : confirmPassword && password === confirmPassword
                        ? 'border-emerald-500/50'
                        : 'border-white/10 focus:border-brand-500/60'
                    }`}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[10px] text-rose-400 mt-1">Las contraseñas no coinciden</p>
                )}
              </div>
            </div>
          </div>

          {/* Botón submit */}
          <button
            type="submit"
            disabled={loading || slugBad}
            className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98] mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creando tu cuenta...</>
            ) : (
              <><span>Crear cuenta gratis</span><ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          {/* Términos */}
          <p className="text-[10px] text-slate-600 text-center leading-relaxed">
            Al crear una cuenta aceptas los términos de servicio de Kaltiro.
            El plan Trial es gratuito por 14 días.
          </p>
        </form>

        {/* Link al login */}
        <div className="text-center space-y-3">
          <p className="text-xs text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/app/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Ingresar
            </Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-700">
          Kaltiro.com — Software de Gestión para Restaurantes
        </p>
      </div>
    </div>
  );
}

// Utilidad debounce
function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
