'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Business } from '@/lib/types/database';
import { createHash } from 'crypto';

export interface AdminSession {
  userId: string;
  email: string;
  nombre: string;
  rol: 'dueño' | 'cajero' | 'cocinero';
  business: Business;
}

const SESSION_KEY = 'kaltiro_admin_session';

function hashPassword(password: string): string {
  // Client-side: use SubtleCrypto async — but for simplicity store as a sync lookup key
  // The actual hash is done server-side via the API route. This is just for storage.
  return password;
}

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        setSession(JSON.parse(raw));
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('kaltiro_admin_business_id');
    setSession(null);
    window.location.href = '/app/login';
  };

  return { session, loading, logout };
}

export function saveSession(s: AdminSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  localStorage.setItem('kaltiro_admin_business_id', s.business.id);
}
