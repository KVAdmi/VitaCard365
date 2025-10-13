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
    try { console.log('[DL] appUrlOpen', url); } catch {}
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
              if (!uid) {
                // En nativo usamos HashRouter, navegar con hash para evitar conflictos
                window.location.hash = '#/login';
                return;
              }
              // Leve fetch runtime para decidir destino
              const { data: acc } = await supabase
                .from('profiles_certificado_v2')
                .select('acceso_activo')
                .eq('user_id', uid)
                .limit(1)
                .single();
              if (acc?.acceso_activo) {
                const dest = next || '/dashboard';
                window.location.hash = `#${dest}`;
              } else {
                window.location.hash = '#/payment-gateway';
              }
            } catch {
              window.location.hash = '#/dashboard';
            }
          }
        }
      }
      // MercadoPago return: vitacard365://mp-return?status=success|failure|pending
      else if (u.protocol === 'vitacard365:' && u.host === 'mp-return') {
        const status = (u.searchParams.get('status') || '').toLowerCase();
        try {
          // Feedback mínimo sin bloquear el flujo
          // TODO: reemplazar por tu sistema de toasts si existe
          console.log('[MP Return] status =', status);
        } catch {}
        // Navegación no bloqueante según estado
        if (typeof window !== 'undefined') {
          if (status === 'success') {
            window.location.hash = '#/recibo'; // TODO: ajustar ruta de recibo real si aplica
          } else if (status === 'pending') {
            window.location.hash = '#/payment-pending'; // TODO
          } else {
            window.location.hash = '#/payment-failure'; // TODO
          }
        }
      }
    } catch (e) {
      // ignore
    }
  });
}
