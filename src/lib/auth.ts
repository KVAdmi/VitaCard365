import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';


// Debug flag (set VITE_DEBUG_AUTH=1 in your env to enable verbose logs)
// Falls back to false if not defined.
// We keep logging lightweight unless explicitly enabled to avoid performance impact.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - import.meta may not be typed in some build contexts / non-ESM tooling
const DEBUG_AUTH: boolean = ((): boolean => {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_DEBUG_AUTH === '1';
  } catch { return false; }
})();
const dlog = (...args: unknown[]) => { if (DEBUG_AUTH) console.log('[AUTH-DL]', ...args); };

const isNative = Capacitor.isNativePlatform
  ? Capacitor.isNativePlatform()
  : Capacitor.getPlatform() !== 'web';

const NATIVE_REDIRECT = 'vitacard365://auth/callback';
const WEB_REDIRECT = 'https://vitacard365.com/auth/callback';

export async function signInWithGoogle(context?: 'login' | 'register') {
  // Guardar contexto para que AuthCallback sepa de dónde viene
  if (context) {
    localStorage.setItem('oauth_context', context);
  }
  // Helper para decidir ruta post-auth (login/registro)
  // Se espera que el contexto sea 'login' o 'register'.
  // Si es 'register', debe navegar a /payment-gateway y NO redirigir luego a /mi-plan.
  // Si es 'login', navegar según acceso_activo.
  console.log('[auth][post-auth] Contexto recibido en signInWithGoogle:', context);
  if (isNative) {
    const redirectTo = NATIVE_REDIRECT;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
          prompt: 'select_account', // Forzar selector de cuentas de Google
        },
      },
    });
    if (error) {
      console.error('signInWithOAuth (native)', error.message);
      return;
    }
    const url = data?.url;
    if (url) {
      try {
        await Browser.open({ url });
      } catch (openErr) {
        console.error('Browser.open failed', openErr);
      }
    }
    return;
  }

  const redirectTo = WEB_REDIRECT;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: false,
      queryParams: {
        prompt: 'select_account' // Forzar selector de cuentas de Google
      }
    },
  });
  if (error) console.error('signInWithOAuth (web)', error.message);
}

// DISABLED: This listener conflicts with the one in src/lib/deeplinks.ts
// The deeplinks.ts listener handles both PKCE and implicit flow correctly
// Keeping this code commented for reference
/*
let AUTH_DEEPLINK_HANDLED = false;
App.addListener('appUrlOpen', async ({ url }: { url: string }) => {
  if (!url) return;
  const normalized = url.split('?')[0];
  const isNew = url.startsWith(DEEP_LINK) || normalized === 'com.vitacard.app://auth-callback';
  const isOld = normalized === 'vitacard365://auth/callback' || normalized === 'vitacard365://auth-callback';
  if (!isNew && !isOld) { dlog('Ignoring non-auth URL'); return; }

  // Evitar procesar múltiples veces el mismo retorno
  if (AUTH_DEEPLINK_HANDLED) { dlog('Deep link already handled, skipping'); return; }
  AUTH_DEEPLINK_HANDLED = true;

  dlog('Inbound deep link', url);
  if (!url?.startsWith('vitacard365://')) return;
  console.info('[appUrlOpen]', url);
  try {
  const { data, error } = await supabase.auth.exchangeCodeForSession(url);
    if (error) {
      console.error('[exchangeCodeForSession][native][error]', error);
      return;
    }
    console.info('[exchangeCodeForSession][native][ok]', data?.session?.user?.id);
    await routeAfterLogin();
  // routeAfterLogin decide la ruta final y loguea acceso_activo y destino.
  } catch (e) {
    console.error('[appUrlOpen][catch]', e);
  }
});
*/
