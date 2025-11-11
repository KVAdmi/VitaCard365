import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';

let inited = false;

export function initAuthDeepLinks() {
  if (inited) return;
  inited = true;
  // Only meaningful on native platforms
  if (!(Capacitor.isNativePlatform && Capacitor.isNativePlatform())) return;

  // Elimina listeners duplicados antes de agregar el único
  App.removeAllListeners();

  App.addListener('appUrlOpen', async ({ url }) => {
    try { console.log('[appUrlOpen]', url); } catch {}
    try {
      const u = new URL(url);
      // MercadoPago return: vitacard365://mp-return?status=success|failure|pending
      if (u.protocol === 'vitacard365:' && u.host === 'mp-return') {
        const status = (u.searchParams.get('status') || '').toLowerCase();
        try {
          console.log('[MP Return] status =', status);
        } catch {}
        if (typeof window !== 'undefined') {
          if (status === 'success') {
            window.location.hash = '#/recibo';
          } else if (status === 'pending') {
            window.location.hash = '#/payment-pending';
          } else {
            window.location.hash = '#/payment-failure';
          }
        }
        return;
      }
      // Recuperación de contraseña: vitacard365://auth/recovery
      if (u.protocol === 'vitacard365:' && u.host === 'auth' && u.pathname.startsWith('/recovery')) {
        console.log('[auth-recovery] deep link recibido:', url);
        if (typeof window !== 'undefined') {
          window.location.hash = '#/set-new-password';
        }
        return;
      }
      // Deep link de login OAuth
      if (u.protocol === 'vitacard365:' && u.host === 'auth' && u.pathname.startsWith('/callback')) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) {
            console.error('[exchangeCodeForSession][native][error]', error);
            return;
          }
          console.info('[exchangeCodeForSession][native][ok]');
          // Aquí deberías llamar a tu función de ruteo post-login
          if (typeof window !== 'undefined') {
            window.location.hash = '#/dashboard';
          }
        } catch (e) {
          console.error('[appUrlOpen][catch]', e);
        }
        return;
      }
    } catch (e) {
      // ignore
    }
  });
}
