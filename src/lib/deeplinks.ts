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
            console.log('[deeplink][native][DEBUG] Extrayendo accessToken...');
            const accessToken = hashParams.get('access_token');
            console.log('[deeplink][native][DEBUG] accessToken length:', accessToken?.length || 0);
            
            console.log('[deeplink][native][DEBUG] Extrayendo refreshToken...');
            const refreshToken = hashParams.get('refresh_token');
            console.log('[deeplink][native][DEBUG] refreshToken length:', refreshToken?.length || 0);
            
            if (!accessToken || !refreshToken) {
              console.error('[deeplink][native][ERROR] Tokens missing!', { hasAccess: !!accessToken, hasRefresh: !!refreshToken });
              if (typeof window !== 'undefined') {
                window.location.hash = '#/login';
              }
              return;
            }
            
            const expiresIn = parseInt(hashParams.get('expires_in') || '3600');
            console.log('[deeplink][native][DEBUG] expiresIn:', expiresIn);
            
            console.log('[deeplink][native][DEBUG] Intentando setSession...');
            console.log('[deeplink][native][DEBUG] Tokens para setSession:', { 
              hasAccessToken: !!accessToken, 
              accessTokenLength: accessToken?.length || 0,
              hasRefreshToken: !!refreshToken,
              refreshTokenLength: refreshToken?.length || 0
            });
            
            try {
              // Setear la sesión manualmente
              console.log('[deeplink][native][DEBUG] Llamando supabase.auth.setSession...');
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              console.log('[deeplink][native][DEBUG] setSession completado');
              console.log('[deeplink][native][DEBUG] setSession data:', {
                hasData: !!data,
                hasSession: !!data?.session,
                hasUser: !!data?.session?.user,
                userId: data?.session?.user?.id,
                userEmail: data?.session?.user?.email
              });
              console.log('[deeplink][native][DEBUG] setSession error:', {
                hasError: !!error,
                errorMessage: error?.message,
                errorName: error?.name,
                errorStatus: (error as any)?.status
              });
              
              sessionData = data;
              sessionError = error;
              
              if (error) {
                console.error('[deeplink][native][ERROR] setSession devolvió error:', JSON.stringify(error));
              }
              if (data?.session) {
                console.log('[deeplink][native][SUCCESS] Sesión establecida correctamente, user:', data.session.user.id);
              }
            } catch (setSessionErr: any) {
              console.error('[deeplink][native][ERROR] setSession lanzó excepción:', setSessionErr);
              console.error('[deeplink][native][ERROR] Exception details:', {
                message: setSessionErr?.message,
                name: setSessionErr?.name,
                stack: setSessionErr?.stack?.substring(0, 200)
              });
              sessionError = setSessionErr as any;
            }
            
            console.log('[deeplink][native][DEBUG] Después de setSession, sessionData:', {
              hasSessionData: !!sessionData,
              hasSession: !!sessionData?.session,
              hasError: !!sessionError
            });
          } else {
            // PKCE flow: código en query params
            console.log('[deeplink][native] Esperando PKCE flow');
            await new Promise(resolve => setTimeout(resolve, 300));
            const { data, error } = await supabase.auth.getSession();
            sessionData = data;
            sessionError = error;
          }
          
          console.log('[deeplink][native][DEBUG] Verificando sesión:', { hasError: !!sessionError, hasData: !!sessionData, hasSession: !!sessionData?.session, userId: sessionData?.session?.user?.id });
          
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
