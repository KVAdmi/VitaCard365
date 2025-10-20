import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!on) return;
      if (error) { setLoading(false); return; }
      setProfile(data);
      setLoading(false);
    })();
    return () => { on = false; };
  }, []);

  return { profile, loading };
}