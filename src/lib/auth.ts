import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';
import { routeAfterLogin } from './routeAfterLogin';


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

// Deep link de retorno
// - En iOS usamos com.vitacard.app://auth-callback (coincide con appId y URL Scheme)
// - Mantiene compatibilidad aceptando también vitacard365://auth/callback como legado
// - Se puede forzar con VITE_DEEP_LINK
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - import.meta puede no estar tipado en todos los contextos

// Detección robusta de plataforma nativa
const ENV_DEEP_LINK = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_DEEP_LINK) as string | undefined;
export const NATIVE_DEEP_LINK: string = ENV_DEEP_LINK || 'vitacard365://auth/callback';
export const isNative =
  typeof window !== 'undefined' &&
  typeof Capacitor?.isNativePlatform === 'function' &&
  Capacitor.isNativePlatform() === true;

// Calcula la URL de redirect web según el router real (HashRouter en nativo, BrowserRouter en web)
function getWebRedirectUrl() {
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://vitacard365.com';
  // El proyecto usa HashRouter en nativo y BrowserRouter en web. En web, la ruta /auth/callback existe y es manejada por AuthCallback.jsx
  // Por lo tanto, en web se debe usar: `${origin}/auth/callback`
  return `${origin}/auth/callback`;
}


export async function signInWithGoogle(context?: 'login' | 'register') {
  // Guardar contexto para que AuthCallback sepa de dónde viene
  if (context) {
    localStorage.setItem('oauth_context', context);
  }
  const webRedirect = getWebRedirectUrl();
  const redirectTo = isNative ? NATIVE_DEEP_LINK : webRedirect;

  // Mantener opciones adicionales y queryParams
  const options: any = {
    redirectTo,
    skipBrowserRedirect: isNative,
    queryParams: {
      prompt: 'select_account',
    },
  };

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options,
  });

  if (error) {
    console.error(`signInWithOAuth (${isNative ? 'native' : 'web'})`, error.message);
    return;
  }

  if (isNative && data?.url) {
    try {
      await Browser.open({ url: data.url });
    } catch (openErr) {
      console.error('Browser.open failed', openErr);
    }
  }
}


// Listener de deep links eliminado de auth.ts. Toda la lógica queda en src/lib/deeplinks.ts
