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
      // Normalizar y aceptar variantes de deep link
      const ENV_DEEP_LINK = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_DEEP_LINK) as string | undefined;
      const NATIVE_DEEP_LINK = ENV_DEEP_LINK || 'vitacard365://auth/callback';
      const normalized = url.split('#')[0].split('?')[0];
      const isAuthUrl =
        normalized === NATIVE_DEEP_LINK ||
        normalized === 'vitacard365://auth/callback' ||
        normalized === 'vitacard365://auth-callback' ||
        normalized === 'com.vitacard.app://auth-callback';

      // MercadoPago return: vitacard365://mp-return?status=success|failure|pending
      if (url.startsWith('vitacard365://mp-return')) {
        const parsed = new URL(url);
        const status = parsed.searchParams.get('status'); // success, failure, pending
        // Navega a la pantalla de resultado en la app
        if (typeof window !== 'undefined') {
          window.location.hash = '#/mp-result?status=' + status;
        }
        return;
      }
      // Recuperación de contraseña: vitacard365://auth/recovery
      if (url.startsWith('vitacard365://auth/recovery')) {
        console.log('[auth-recovery] deep link recibido:', url);
        if (typeof window !== 'undefined') {
          // En nativo usamos HashRouter, por eso navegamos via hash.
          window.location.hash = '#/set-new-password';
        }
        return;
      }
      // Deep link de login OAuth
      if (isAuthUrl) {
        try {
          console.log('[deeplink][native] OAuth callback recibido');
          // Supabase maneja automáticamente el intercambio PKCE
          // Solo necesitamos obtener la sesión actual
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
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
              window.location.hash = '#/payment-gateway';
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
              window.location.hash = '#/dashboard';
            } else {
              console.log('[deeplink][native] Navegando a: /mi-plan');
              window.location.hash = '#/mi-plan';
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
