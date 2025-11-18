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
      
      // Password reset deep link: vitacard365://reset-password
      if (u.protocol === 'vitacard365:' && u.host === 'reset-password') {
        console.log('[DL] Password reset deep link detected');
        
        // Extraer access_token y refresh_token del hash o query params
        const hashParams = new URLSearchParams(u.hash?.substring(1) || '');
        const queryParams = u.searchParams;
        
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        const type = hashParams.get('type') || queryParams.get('type');
        
        // Verificar que sea un deep link de tipo recovery
        if (type === 'recovery' && accessToken && refreshToken) {
          try {
            // Establecer la sesión con los tokens recibidos
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('[DL] Error al establecer sesión de recuperación:', error);
              if (typeof window !== 'undefined') {
                window.location.hash = '#/reset-password';
              }
              return;
            }
            
            console.log('[DL] Sesión de recuperación establecida correctamente');
            // Redirigir a la página de actualización de contraseña
            if (typeof window !== 'undefined') {
              window.location.hash = '#/update-password';
            }
          } catch (err) {
            console.error('[DL] Error procesando deep link de recuperación:', err);
            if (typeof window !== 'undefined') {
              window.location.hash = '#/reset-password';
            }
          }
        } else {
          console.error('[DL] Deep link de recuperación inválido o incompleto');
          if (typeof window !== 'undefined') {
            window.location.hash = '#/reset-password';
          }
        }
        return;
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
      console.error('[DL] Error procesando deep link:', e);
      // ignore
    }
  });
}
