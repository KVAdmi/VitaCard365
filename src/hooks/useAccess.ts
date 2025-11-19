import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { DEBUG_ACCESS } from '@/config/debug';

export function useAccess() {
  const { user } = useAuth();
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('profiles')
      .select('acceso_activo, estado_pago, membresia')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) setError(error);
        setAccess(data);
        setLoading(false);
        if (DEBUG_ACCESS) {
          console.log('[useAccess] acceso:', data);
        }
      });
  }, [user]);

  return { access, loading, error };
}
