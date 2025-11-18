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
    try {
      console.log('[appUrlOpen][native] URL cruda recibida:', url);
      const u = new URL(url);
      console.log('[appUrlOpen][native] Parsed:', {
        protocol: u.protocol,
        host: u.host,
        pathname: u.pathname,
        search: u.search,
        hash: u.hash
      });

      // MercadoPago return: vitacard365://mp-return?status=success|failure|pending
      if (u.protocol === 'vitacard365:' && u.host === 'mp-return') {
        const status = (u.searchParams.get('status') || '').toLowerCase();
        console.log('[MP Return][native] status =', status);
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
        try {
          console.log('[auth-recovery][native] Deep link recibido:', url);
          console.log('[auth-recovery][native] Parsed:', {
            protocol: u.protocol,
            host: u.host,
            pathname: u.pathname,
            search: u.search,
            hash: u.hash
          });
          // Detección de recovery por pathname y/o type=recovery en search/hash
          const isRecovery = u.pathname.startsWith('/recovery') || u.search.includes('type=recovery') || u.hash.includes('type=recovery');
          if (isRecovery && typeof window !== 'undefined') {
            console.log('[auth-recovery][native] Navegando a pantalla de nueva contraseña (#/set-new-password)');
            window.location.hash = '#/set-new-password';
            // NO redirigir a login ni onboarding después
          }
        } catch (err) {
          console.error('[auth-recovery][native][ERROR] Exception en handler recovery:', err);
        }
        return;
      }

      // Deep link de login OAuth
      if (u.protocol === 'vitacard365:' && u.host === 'auth' && u.pathname.startsWith('/callback')) {
        try {
          // Manejo original: tokens en hash
          const hashParams = new URLSearchParams(u.hash.substring(1));
          const hasAccessToken = hashParams.has('access_token');
          let sessionData = null;
          let sessionError = null;
          if (hasAccessToken) {
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            if (!accessToken || !refreshToken) {
              if (typeof window !== 'undefined') window.location.hash = '#/login';
              return;
            }
            try {
              const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
              sessionData = data;
              sessionError = error;
            } catch (setSessionErr) {
              sessionError = setSessionErr;
            }
          } else {
            await new Promise(resolve => setTimeout(resolve, 300));
            const { data, error } = await supabase.auth.getSession();
            sessionData = data;
            sessionError = error;
          }
          if (sessionError || !sessionData?.session) {
            if (typeof window !== 'undefined') window.location.hash = '#/login';
            return;
          }
          // Leer el contexto guardado (login o register)
          const context = localStorage.getItem('oauth_context') || 'login';
          if (context === 'register') {
            if (typeof window !== 'undefined') window.location.replace('#/payment-gateway');
            localStorage.removeItem('oauth_context');
            return;
          }
          // Context = login: consultar acceso
          const { data: perfil } = await supabase
            .from('profiles_certificado_v2')
            .select('acceso_activo')
            .eq('user_id', sessionData.session.user.id)
            .maybeSingle();
          const accesoActivo = !!perfil?.acceso_activo;
          const rutaFinal = accesoActivo ? '/dashboard' : '/mi-plan';
          if (typeof window !== 'undefined') window.location.replace(`#${rutaFinal}`);
          localStorage.removeItem('oauth_context');
        } catch (e) {
          if (typeof window !== 'undefined') window.location.hash = '#/login';
        }
        return;
      }
    } catch (e) {
      console.error('[appUrlOpen][native][ERROR] Exception en listener:', e);
    }
  });
}
