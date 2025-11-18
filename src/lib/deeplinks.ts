import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';
import { hydrateSessionFromUrlParams } from './auth'; // Asegúrate que esté exportada en auth.ts
// Si tryCloseInAppBrowser no existe, reemplaza por una función vacía
const tryCloseInAppBrowser = async () => {};
// Simple debug logger
const dlog = (...args: any[]) => { if (process.env.NODE_ENV !== 'production') console.log('[deeplinks]', ...args); };

// Flag para evitar doble manejo de deep links
let AUTH_DEEPLINK_HANDLED = false;
let inited = false;

export function initAuthDeepLinks() {
  if (inited) return;
  inited = true;
  // Only meaningful on native platforms
  if (!Capacitor.isNativePlatform || !Capacitor.isNativePlatform()) return;

  // Elimina listeners duplicados antes de agregar el único
  App.removeAllListeners();

  App.addListener('appUrlOpen', async ({ url }) => {
    if (!url) return;

    // Evitar doble manejo (el SO puede disparar launch + appUrlOpen)
    if (AUTH_DEEPLINK_HANDLED) { dlog('Deep link already handled, skipping'); return; }
    AUTH_DEEPLINK_HANDLED = true;

    try {
      dlog('Inbound deep link', url);
      const u = new URL(url);

      // --- FIX SOLO FLUJO NATIVO ---
      if (url.startsWith('vitacard365://') && url.includes('/auth/callback')) {
        dlog('[deeplink][native][callback] detectado flujo nativo Google OAuth:', url);
        try {
          const hydrated = await hydrateSessionFromUrlParams(u);
          if (!hydrated) {
            console.error('[deeplink][native][callback] error al hidratar sesión desde URL:', url);
          }
        } catch (err) {
          console.error('[deeplink][native][callback] error al hidratar sesión:', err);
        }
        // Verificar que realmente existe sesión
        let sessionOk = false;
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            sessionOk = true;
          }
        } catch (err) {
          console.error('[deeplink][native][callback] error al obtener sesión:', err);
        }
        if (!sessionOk) {
          console.error('[deeplink][native][callback] sin sesión tras setSession, mandando a #/login');
          if (typeof window !== 'undefined') window.location.hash = '#/login';
          AUTH_DEEPLINK_HANDLED = false;
          return;
        }
        // Si hay sesión, NO redirigir a #/auth/callback en nativo
        // Deja que AuthContext maneje la navegación final
        dlog('[deeplink][native][callback] sesión OK, esperando navegación de AuthContext');
        AUTH_DEEPLINK_HANDLED = false;
        return;
      }

      // --- FLUJO WEB Y OTROS ---
      // Compat: aceptar legacy vitacard365://auth-callback
      const isAuthCallback =
        (u.protocol === 'vitacard365:' && u.host === 'auth' && u.pathname === '/callback') ||
        (u.protocol === 'vitacard365:' && u.host === 'auth-callback');

      const isRecovery =
        (u.protocol === 'vitacard365:' && u.host === 'auth' && u.pathname === '/recovery');

      await tryCloseInAppBrowser();

      if (isAuthCallback) {
        await hydrateSessionFromUrlParams(u);
        if (typeof window !== 'undefined') {
          // Reutiliza la ruta existente para ruteo según acceso
          window.location.hash = '#/auth/callback';
        }
        AUTH_DEEPLINK_HANDLED = false;
        return;
      }

      if (isRecovery) {
        await hydrateSessionFromUrlParams(u);
        if (typeof window !== 'undefined') {
          // Muestra formulario de nueva contraseña dentro de la app
          window.location.hash = '#/reset-password?stage=update';
        }
        AUTH_DEEPLINK_HANDLED = false;
        return;
      }

      dlog('Ignoring non-auth URL', url);
    } catch (e) {
      console.error('handleInboundUrl', e);
      dlog('Fatal error in deep link handler', e);
      if (typeof window !== 'undefined') window.location.replace('#/login');
      AUTH_DEEPLINK_HANDLED = false;
    }
  });
}
