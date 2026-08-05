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
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .limit(1)
          .single();

        if (!error && data) {
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
