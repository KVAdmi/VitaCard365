import { App } from '@capacitor/app';
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

// Deep link de retorno
// - En nativo usamos vitacard365://auth/callback (coincide con Redirect URLs en Supabase)
// - Mantiene compatibilidad aceptando también vitacard365://auth-callback en el listener
// - Se puede forzar con VITE_DEEP_LINK
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - import.meta puede no estar tipado en todos los contextos
const ENV_DEEP_LINK = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_DEEP_LINK) as string | undefined;
const isNative = !!(Capacitor.isNativePlatform && Capacitor.isNativePlatform());
export const DEEP_LINK: string = ENV_DEEP_LINK
  || (isNative ? 'vitacard365://auth/callback' : 'vitacard365://auth/callback');

export async function signInWithGoogle() {
  // En web, usar el origen completo para evitar problemas con custom schemes
  const webRedirect = (typeof window !== 'undefined' && window.location?.origin)
    ? `${window.location.origin}/auth/callback`
    : undefined;
  const redirectTo = isNative ? 'vitacard365://auth/callback' : (webRedirect || DEEP_LINK);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: false },
  });
  if (error) console.error('signInWithOAuth', error.message);
}

let AUTH_DEEPLINK_HANDLED = false;
App.addListener('appUrlOpen', async ({ url }: { url: string }) => {
  if (!url) return;
  const normalized = url.split('?')[0];
  
  // Check for password recovery deep link
  const isRecovery = normalized === 'vitacard365://auth/recovery' || url.startsWith('vitacard365://auth/recovery');
  
  // Check for OAuth callback deep links (support both formats for compatibility)
  const isAuthCallback = url.startsWith(DEEP_LINK) || normalized === 'vitacard365://auth/callback' || normalized === 'vitacard365://auth-callback';
  
  if (!isRecovery && !isAuthCallback) { 
    dlog('Ignoring non-auth URL'); 
    return; 
  }

  // Evitar procesar múltiples veces el mismo retorno
  if (AUTH_DEEPLINK_HANDLED) { dlog('Deep link already handled, skipping'); return; }
  AUTH_DEEPLINK_HANDLED = true;

  dlog('Inbound deep link', url);
  
  try {
    // Intentar cerrar el in-app browser (best-effort)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const maybeBrowser: any = (globalThis as any).Capacitor?.Plugins?.Browser;
      if (maybeBrowser?.close) {
        dlog('Closing in-app browser');
        await maybeBrowser.close();
      }
    } catch (closeErr) {
      dlog('Browser close attempt failed (non-fatal)', closeErr);
    }

    // Handle password recovery flow
    if (isRecovery) {
      dlog('Password recovery deep link detected');
      let u: URL | null = null;
      try { u = new URL(url); } catch { /* ignore parse failures */ }
      const code = u?.searchParams?.get?.('code');
      
      if (code) {
        dlog('Recovery code found, exchanging for session...');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('exchangeCodeForSession (recovery)', exchangeError.message);
          dlog('Recovery exchange failed', exchangeError);
          if (typeof window !== 'undefined') window.location.replace('#/login');
          return;
        }
        dlog('Recovery exchange success, redirecting to reset password form');
      }
      
      // Redirect to reset password page with stage=update
      if (typeof window !== 'undefined') {
        window.location.replace('#/reset-password?stage=update');
      }
      return;
    }

    // Handle OAuth callback flow (Google sign-in)
    // Parsear URL para detectar PKCE (?code) vs implícito (#access_token)
    let u: URL | null = null;
    try { u = new URL(url); } catch { /* ignore parse failures */ }
    const hasCode = !!u?.searchParams?.get?.('code');
    const hashStr = u?.hash || '';
    const hasAccessToken = hashStr.includes('access_token=');

    if (hasCode) {
      const code = u?.searchParams?.get?.('code') || '';
      if (!code) {
        dlog('PKCE code missing after detection');
        if (typeof window !== 'undefined') window.location.replace('#/login');
        return;
      }
      dlog('PKCE detected (?code). Exchanging code for session...');
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error('exchangeCodeForSession', exchangeError.message);
        dlog('Exchange failed', exchangeError);
        // fallback a login si falla
        if (typeof window !== 'undefined') window.location.replace('#/login');
        return;
      }
      dlog('Exchange success');
      try { if (typeof window !== 'undefined') window.localStorage.setItem('vita_oauth_return', String(Date.now())); } catch {}
    } else if (hasAccessToken) {
      dlog('Implicit flow detected (#access_token). Setting session...');
      const params = new URLSearchParams((hashStr || '').replace(/^#/, ''));
      const access_token = params.get('access_token') || '';
      const refresh_token = params.get('refresh_token') || '';
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) {
          console.error('setSession error', error);
          if (typeof window !== 'undefined') window.location.replace('#/login');
          return;
        }
        dlog('setSession success');
        try { if (typeof window !== 'undefined') window.localStorage.setItem('vita_oauth_return', String(Date.now())); } catch {}
      } else {
        dlog('Missing tokens in hash');
        if (typeof window !== 'undefined') window.location.replace('#/login');
        return;
      }
    } else {
      dlog('No code or tokens found in URL');
      if (typeof window !== 'undefined') window.location.replace('#/login');
      return;
    }

    // Confirmar sesión y navegar (reuse AuthCallback page logic)
    if (typeof window !== 'undefined') {
      dlog('Redirecting to /auth/callback to handle routing based on user status');
      // Reuse the AuthCallback page which already has the logic to check access and route accordingly
      window.location.replace('#/auth/callback');
    }
  } catch (e) {
    console.error('appUrlOpen handler', e);
    dlog('Fatal error in deep link handler', e);
    if (typeof window !== 'undefined') window.location.replace('#/login');
  } finally {
    // Reset flag after a delay to allow future deep links
    setTimeout(() => { AUTH_DEEPLINK_HANDLED = false; }, 2000);
  }
});
