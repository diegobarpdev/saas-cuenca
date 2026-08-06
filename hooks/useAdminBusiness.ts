'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Business } from '@/lib/types/database';

export function useAdminBusiness() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBusiness() {
      try {
        const supabase = createClient();
        const activeBusinessId = typeof window !== 'undefined' ? localStorage.getItem('piku_admin_business_id') : null;

        let data: Business | null = null;
        let error: any = null;

        if (activeBusinessId) {
          const res = await supabase
            .from('businesses')
            .select('*')
            .eq('id', activeBusinessId)
            .single();
          data = res.data;
          error = res.error;
        }

        // Si no hay ID guardado o falló la búsqueda con ese ID, cargar la primera empresa disponible
        if (!data || error) {
          const fallbackRes = await supabase
            .from('businesses')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!fallbackRes.error && fallbackRes.data) {
            data = fallbackRes.data as Business;
            if (typeof window !== 'undefined') {
              localStorage.setItem('piku_admin_business_id', data.id);
            }
          }
        }

        if (data) {
          setBusiness(data as Business);
        }
      } catch (err) {
        console.error('Error cargando negocio de Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBusiness();
  }, []);

  return { business, loading };
}
