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
