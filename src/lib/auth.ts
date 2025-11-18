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
// - En nativo usamos vitacard365://auth/callback (coincide con Supabase dashboard)
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
  const redirectTo = isNative ? DEEP_LINK : (webRedirect || DEEP_LINK);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: false },
  });
  if (error) console.error('signInWithOAuth', error.message);
}

let AUTH_DEEPLINK_HANDLED = false;
App.addListener('appUrlOpen', async ({ url }: { url: string }) => {
  if (!url) return;
  const normalized = url.split('?')[0].split('#')[0];
  
  // Check for OAuth callback (new and legacy)
  const isOAuthNew = url.startsWith('vitacard365://auth/callback');
  const isOAuthOld = url.startsWith('vitacard365://auth-callback');
  const isRecovery = url.startsWith('vitacard365://auth/recovery');
  
  if (!isOAuthNew && !isOAuthOld && !isRecovery) { 
    dlog('Ignoring non-auth URL:', normalized); 
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

    // Handle password recovery deep link
    if (isRecovery) {
      dlog('Password recovery deep link detected');
      let u: URL | null = null;
      try { u = new URL(url); } catch { /* ignore parse failures */ }
      const code = u?.searchParams?.get?.('code');
      const hashStr = u?.hash || '';
      const hasAccessToken = hashStr.includes('access_token=');
      
      if (code) {
        dlog('Recovery: exchanging code for session');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('Recovery exchangeCodeForSession error', exchangeError.message);
          if (typeof window !== 'undefined') window.location.replace('#/login');
          return;
        }
      } else if (hasAccessToken) {
        dlog('Recovery: setting session from hash tokens');
        const params = new URLSearchParams((hashStr || '').replace(/^#/, ''));
        const access_token = params.get('access_token') || '';
        const refresh_token = params.get('refresh_token') || '';
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            console.error('Recovery setSession error', error);
            if (typeof window !== 'undefined') window.location.replace('#/login');
            return;
          }
        } else {
          dlog('Recovery: missing tokens');
          if (typeof window !== 'undefined') window.location.replace('#/login');
          return;
        }
      } else {
        dlog('Recovery: no code or tokens found');
        if (typeof window !== 'undefined') window.location.replace('#/login');
        return;
      }
      
      // Navigate to reset password update stage
      dlog('Recovery: navigating to reset-password update stage');
      if (typeof window !== 'undefined') {
        window.location.replace('#/reset-password?stage=update');
      }
      return;
    }

    // Handle OAuth callback (Google)
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

    // OAuth: Navigate to AuthCallback for business logic (payment gateway vs dashboard)
    dlog('OAuth: navigating to /auth/callback for routing logic');
    if (typeof window !== 'undefined') {
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
