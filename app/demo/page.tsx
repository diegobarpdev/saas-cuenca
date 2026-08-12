'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveSession } from '@/hooks/useAdminSession';
import { Zap } from 'lucide-react';

export default function DemoAutoLoginPage() {
  const router = useRouter();

  useEffect(() => {
    async function loginDemo() {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'demo@kaltiro.com', password: 'demo1234' }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          saveSession(data.session);
          sessionStorage.removeItem('is_super_admin_impersonating');
          router.replace(`/${data.session.business.slug}/admin/dashboard`);
        } else {
          router.replace('/admin/login');
        }
      } catch {
        router.replace('/admin/login');
      }
    }

    loginDemo();
  }, []);

  return (
    <div className="min-h-screen bg-[#070A11] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-white">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center">
          <Zap className="w-7 h-7 text-brand-400 animate-pulse" />
        </div>
        <p className="text-sm text-slate-400 font-medium">Cargando demo...</p>
      </div>
    </div>
  );
}
