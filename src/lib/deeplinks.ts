import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';

let inited = false;

export function initAuthDeepLinks() {
  if (inited) return;
  inited = true;
  // Only meaningful on native platforms
  if (!(Capacitor.isNativePlatform && Capacitor.isNativePlatform())) return;

  App.addListener('appUrlOpen', async ({ url }) => {
    try {
      const u = new URL(url);
      // Expect vitacard365://auth/callback?code=...&state=...
      if (u.protocol === 'vitacard365:' && u.host === 'auth' && u.pathname === '/callback') {
        const code = u.searchParams.get('code');
        const next = u.searchParams.get('next');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            try {
              const { data } = await supabase.auth.getUser();
              const uid = data?.user?.id || null;
              if (!uid) { window.location.replace('/login'); return; }
              // Leve fetch runtime para decidir destino
              const { data: acc } = await supabase
                .from('profiles_certificado_v2')
                .select('acceso_activo')
                .eq('user_id', uid)
                .limit(1)
                .single();
              if (acc?.acceso_activo) {
                window.location.replace(next || '/dashboard');
              } else {
                window.location.replace('/payment-gateway');
              }
            } catch {
              window.location.replace('/dashboard');
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }
  });
}
