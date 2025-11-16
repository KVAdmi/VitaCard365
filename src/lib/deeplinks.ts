import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';

let inited = false;

export function initAuthDeepLinks() {
  if (inited) return;
  inited = true;
  // Only meaningful on native platforms
  if (!Capacitor.isNativePlatform || !Capacitor.isNativePlatform()) return;

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
          window.location.replace('#/set-new-password');
        }
        return;
      }
      // Deep link de login OAuth
      if (u.protocol === 'vitacard365:' && u.host === 'auth' && u.pathname.startsWith('/callback')) {
        try {
          console.log('[deeplink][native] OAuth callback recibido');
          
          // Supabase puede devolver tokens en el hash (#access_token) o código PKCE (?code)
          // Detectar qué tipo de respuesta es
          const hashParams = new URLSearchParams(u.hash.substring(1)); // Quitar el #
          const hasAccessToken = hashParams.has('access_token');
          
          let sessionData: any = null;
          let sessionError: any = null;
          
          if (hasAccessToken) {
            // Implicit flow: tokens en el hash
            console.log('[deeplink][native] Tokens detectados en hash (implicit flow)');
            const accessToken = hashParams.get('access_token')!;
            const refreshToken = hashParams.get('refresh_token')!;
            const expiresIn = parseInt(hashParams.get('expires_in') || '3600');
            
            // Setear la sesión manualmente
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            sessionData = data;
            sessionError = error;
          } else {
            // PKCE flow: código en query params
            console.log('[deeplink][native] Esperando PKCE flow');
            await new Promise(resolve => setTimeout(resolve, 300));
            const { data, error } = await supabase.auth.getSession();
            sessionData = data;
            sessionError = error;
          }
          
          if (sessionError || !sessionData?.session) {
            console.error('[deeplink][native] Error obteniendo sesión:', sessionError);
            if (typeof window !== 'undefined') {
              window.location.hash = '#/login';
            }
            return;
          }
          
          console.log('[deeplink][native] Sesión obtenida, user:', sessionData.session.user.id);
          
          // Leer el contexto guardado (login o register)
          const context = localStorage.getItem('oauth_context') || 'login';
          console.log('[deeplink][native] Contexto:', context);
          
          if (context === 'register') {
            // Usuario nuevo -> payment-gateway
            console.log('[deeplink][native] Navegando a: /payment-gateway');
            if (typeof window !== 'undefined') {
              window.location.replace('#/payment-gateway');
            }
            localStorage.removeItem('oauth_context');
            return;
          }
          
          // Context = login: consultar acceso
          console.log('[deeplink][native] Consultando acceso...');
          const { data: perfil, error: perfilError } = await supabase
            .from('profiles_certificado_v2')
            .select('acceso_activo')
            .eq('user_id', sessionData.session.user.id)
            .maybeSingle();
          
          const accesoActivo = !!perfil?.acceso_activo;
          console.log('[deeplink][native] Acceso activo:', accesoActivo);
          
          if (typeof window !== 'undefined') {
            if (accesoActivo) {
              console.log('[deeplink][native] Navegando a: /dashboard');
              window.location.replace('#/dashboard');
            } else {
              console.log('[deeplink][native] Navegando a: /mi-plan');
              window.location.replace('#/mi-plan');
            }
          }
          
          localStorage.removeItem('oauth_context');
        } catch (e) {
          console.error('[deeplink][native][catch]', e);
          if (typeof window !== 'undefined') {
            window.location.hash = '#/login';
          }
        }
        return;
      }
    } catch (e) {
      // ignore
    }
  });
}
