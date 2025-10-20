import { useEffect, useRef } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { getDeviceId } from '@/utils/deviceId';
import { supabase } from '@/lib/supabaseClient';

export function useLinkKvAfterAuth() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const deviceId = await getDeviceId();
      try {
        const res = await fetchWithAuth('link_kv_redemption', {
          method: 'POST',
          body: JSON.stringify({ userId, deviceId }),
        });
        if (!res.ok) return; // silencioso
        // opcional: console.info('[KV] linked');
      } catch {}
    })();
  }, []);
}