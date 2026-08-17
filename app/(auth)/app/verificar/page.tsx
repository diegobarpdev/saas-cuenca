'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, Zap } from 'lucide-react';

function VerificarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('Link inválido.');
      setStatus('error');
      return;
    }

    fetch(`/api/registro/verificar?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          sessionStorage.setItem('kaltiro_verified_token', JSON.stringify({
            token,
            nombre_admin: data.nombre_admin,
            email: data.email,
          }));
          setStatus('ok');
          setTimeout(() => router.push('/app/onboarding'), 1200);
        } else {
          setErrorMsg(data.error || 'Link inválido o ya utilizado.');
          setStatus('error');
        }
      })
      .catch(() => {
        setErrorMsg('Error de conexión. Intenta nuevamente.');
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="relative text-center space-y-5 max-w-sm w-full">
      {status === 'loading' && (
        <>
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Verificando tu cuenta...</p>
        </>
      )}

      {status === 'ok' && (
        <>
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-xl font-black text-white">¡Correo confirmado!</h2>
          <p className="text-slate-400 text-sm">Redirigiendo para configurar tu negocio...</p>
          <Loader2 className="w-5 h-5 text-brand-400 animate-spin mx-auto" />
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto">
            <XCircle className="w-7 h-7 text-rose-400" />
          </div>
          <h2 className="text-xl font-black text-white">Link inválido</h2>
          <p className="text-slate-400 text-sm">{errorMsg}</p>
          <Link
            href="/app/registro"
            className="inline-block px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm transition-all active:scale-95"
          >
            Volver al registro
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerificarPage() {
  return (
    <div className="min-h-screen bg-[#070A11] text-white flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/5 blur-3xl" />
      </div>
      <Suspense fallback={
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Cargando...</p>
        </div>
      }>
        <VerificarContent />
      </Suspense>
    </div>
  );
}
