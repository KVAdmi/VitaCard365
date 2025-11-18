import { useEffect } from 'react';
import { supabase } from './lib/supabaseClient';

async function refreshKv() {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return;

  const { data: active, error } = await supabase.rpc('is_kv_active', { p_user_id: userId });
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