import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supa = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

async function refreshKv() {
  const { data: { session } } = await supa.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return;

  const { data: active, error } = await supa.rpc('is_kv_active', { p_user_id: userId });
  if (error) return; // no bloqueante
  if (!active) sessionStorage.removeItem('kv_gate'); // se acabó la ventana → vuelve paywall
}

function App() {
  useEffect(() => {
    refreshKv();
  }, []);

  return (
    <div>
      {/* ...existing code... */}
    </div>
  );
}

export default App;