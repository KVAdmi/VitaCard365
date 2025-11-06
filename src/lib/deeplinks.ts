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
      // Deep link de recuperación de contraseña: vitacard365://auth/recovery#access_token=...&refresh_token=...&type=recovery
      if (u.protocol === 'vitacard365:' && u.host === 'auth' && u.pathname === '/recovery') {
        const hash = u.hash.startsWith('#') ? u.hash.slice(1) : u.hash;
        const params = new URLSearchParams(hash);
        const type = params.get('type');
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (type === 'recovery' && access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error && typeof window !== 'undefined') {
            window.location.hash = '#/set-new-password';
          } else {
            console.error('Error setSession:', error);
          }
        }
      }
      // MercadoPago return: vitacard365://mp-return?status=success|failure|pending
      if (u.protocol === 'vitacard365:' && u.host === 'mp-return') {
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
