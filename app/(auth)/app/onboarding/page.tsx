'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap, ArrowRight, ArrowLeft, Phone, CheckCircle2, XCircle, Loader2, Building2,
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

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export default function OnboardingPage() {
  const router = useRouter();

  const [verified, setVerified] = useState<{ token: string; nombre_admin: string; email: string } | null>(null);

  const [nombreNegocio, setNombreNegocio] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [telefono, setTelefono] = useState('');

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Cargar token verificado del paso anterior
  useEffect(() => {
    const raw = sessionStorage.getItem('kaltiro_verified_token');
    if (!raw) {
      router.replace('/app/registro');
      return;
    }
    try {
      setVerified(JSON.parse(raw));
    } catch {
      router.replace('/app/registro');
    }
  }, []);

  const checkSlug = useCallback(
    debounce(async (s: string) => {
      if (!s || s.length < 3) { setSlugStatus('idle'); return; }
      setSlugStatus('checking');
      try {
        const res = await fetch(`/api/registro?slug=${encodeURIComponent(s)}`);
        const data = await res.json();
        setSlugStatus(data.available ? 'available' : 'taken');
        setSlug(data.slug);
      } catch {
        setSlugStatus('idle');
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (slugManual) return;
    const generated = slugify(nombreNegocio);
    setSlug(generated);
    if (generated.length >= 3) checkSlug(generated);
    else setSlugStatus('idle');
  }, [nombreNegocio, slugManual]);

  const handleSlugChange = (val: string) => {
    setSlugManual(true);
    setSlug(val);
    checkSlug(slugify(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) return;
    setError('');

    if (slugStatus === 'taken') { setError('La URL del negocio ya está en uso'); return; }
    if (slug.length < 3) { setError('La URL debe tener al menos 3 caracteres'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/registro/completar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verified.token,
          nombre_negocio: nombreNegocio,
          slug_raw: slug,
          telefono,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Error al crear la cuenta');
        setLoading(false);
        return;
      }

      sessionStorage.removeItem('kaltiro_verified_token');
      setSuccess(true);
      saveSession(data.session);
      setTimeout(() => router.push(`/${data.slug}/app/dashboard`), 1500);
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
          <h2 className="text-xl font-black text-white">¡Todo listo!</h2>
          <p className="text-slate-400 text-sm">Redirigiendo a tu panel...</p>
          <Loader2 className="w-5 h-5 text-brand-400 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!verified) return null;

  const slugOk = slugStatus === 'available';
  const slugBad = slugStatus === 'taken';

  return (
    <div className="min-h-screen bg-[#070A11] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-6 py-8">
        <Link href="/app/registro" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver
        </Link>

        <div className="text-center">
          <h1 className="text-2xl font-black text-white tracking-tight">Cuéntanos tu negocio</h1>
          <p className="text-xs text-slate-500 mt-1">Hola {verified.nombre_admin.split(' ')[0]}, casi listo</p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs text-slate-500">Tu cuenta</span>
          </div>
          <div className="flex-1 h-px bg-brand-500/40" />
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-brand-500 text-slate-950 text-[10px] font-black flex items-center justify-center">2</div>
            <span className="text-xs font-semibold text-white">Tu negocio</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0D1220]/80 backdrop-blur-md border border-white/10 rounded-3xl p-7 shadow-2xl space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nombre del negocio</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="text" required placeholder="Ej: Café El Sagrario" value={nombreNegocio} onChange={e => setNombreNegocio(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-brand-500/60 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">URL de tu catálogo</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-600 text-xs font-mono pointer-events-none">kaltiro.com/</span>
              <input type="text" required placeholder="mi-negocio" value={slug} onChange={e => handleSlugChange(e.target.value)}
                className={`w-full pl-28 pr-9 py-2.5 rounded-xl bg-[#070A11] border text-sm text-white placeholder-slate-700 font-mono focus:outline-none transition-colors ${
                  slugOk ? 'border-emerald-500/50' : slugBad ? 'border-rose-500/50' : 'border-white/10 focus:border-brand-500/60'}`} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {slugStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />}
                {slugOk && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {slugBad && <XCircle className="w-4 h-4 text-rose-400" />}
              </span>
            </div>
            {slugOk && <p className="text-[10px] text-emerald-400 mt-1">✓ Disponible</p>}
            {slugBad && <p className="text-[10px] text-rose-400 mt-1">✗ Ya está en uso — elige otro</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">WhatsApp del negocio</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="tel" required placeholder="593987654321" value={telefono} onChange={e => setTelefono(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white font-mono placeholder-slate-700 focus:outline-none focus:border-brand-500/60 transition-colors" />
            </div>
            <p className="text-[10px] text-slate-600 mt-1">Número con código de país: 593 + número</p>
          </div>

          <button type="submit" disabled={loading || slugBad || slugStatus === 'checking'}
            className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98] mt-2">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando tu negocio...</>
              : <><span>Crear mi negocio</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-700">
          Kaltiro.com — Software de Gestión para Restaurantes
        </p>
      </div>
    </div>
  );
}
