'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Business } from '@/lib/types/database';

export function useAdminBusiness(slug?: string) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBusiness() {
      try {
        // Leer sesión guardada (siempre existe si el usuario está logueado)
        const sessionRaw = typeof window !== 'undefined'
          ? localStorage.getItem('kaltiro_admin_session')
          : null;
        const session = sessionRaw ? JSON.parse(sessionRaw) : null;

        // Si hay slug en la URL (páginas de caja/cocina), validar que coincida
        if (slug) {
          const supabase = createClient();
          const res = await supabase
            .from('businesses')
            .select('*')
            .eq('slug', slug)
            .single();

          if (!res.data) {
            if (typeof window !== 'undefined') window.location.href = '/';
            setLoading(false);
            return;
          }

          // Validar que la sesión activa pertenece a este negocio
          if (session && session.business?.id && session.business.id !== res.data.id) {
            console.warn('Acceso denegado: negocio no coincide con la sesión activa');
            if (typeof window !== 'undefined') {
              alert('Acceso denegado: No tienes credenciales para gestionar ' + res.data.nombre);
              window.location.href = '/app/login';
            }
            setLoading(false);
            return;
          }

          setBusiness(res.data as Business);
          setLoading(false);
          return;
        }

        // Sin slug: usar el negocio de la sesión directamente
        if (session?.business) {
          // Refrescar datos del negocio desde Supabase para tener datos actualizados
          const supabase = createClient();
          const res = await supabase
            .from('businesses')
            .select('*')
            .eq('id', session.business.id)
            .single();

          if (res.data) {
            setBusiness(res.data as Business);
            // Actualizar el ID en localStorage por compatibilidad
            if (typeof window !== 'undefined') {
              localStorage.setItem('kaltiro_admin_business_id', res.data.id);
            }
          } else {
            // Sesión inválida — redirigir a login
            if (typeof window !== 'undefined') {
              localStorage.removeItem('kaltiro_admin_session');
              localStorage.removeItem('kaltiro_admin_business_id');
              window.location.href = '/app/login';
            }
          }
          setLoading(false);
          return;
        }

        // Sin sesión y sin slug — redirigir a login
        if (typeof window !== 'undefined') {
          window.location.href = '/app/login';
        }
      } catch (err) {
        console.error('Error cargando negocio:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBusiness();
  }, [slug]);

  return { business, loading };
}
