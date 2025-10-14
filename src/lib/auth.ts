import { App } from '@capacitor/app';
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

// Deep link de retorno (por compatibilidad usamos alias antiguo por defecto).
// Puedes forzar el nuevo con VITE_DEEP_LINK=vitacard365://auth-callback
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - import.meta puede no estar tipado en todos los contextos
export const DEEP_LINK: string = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_DEEP_LINK)
  || 'vitacard365://auth/callback';

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: DEEP_LINK, skipBrowserRedirect: false },
  });
  if (error) console.error('signInWithOAuth', error.message);
}

// Handler de retorno (Google → Supabase → App)
// Soporta tanto vitacard365://auth-callback como el alias previo vitacard365://auth/callback
App.addListener('appUrlOpen', async ({ url }) => {
  if (!url) return;
  dlog('Inbound deep link', url);
  const base = url.split('?')[0];
  const isTarget = url.startsWith(DEEP_LINK) || base === 'vitacard365://auth/callback';
  if (!isTarget) { dlog('Ignoring non-auth URL'); return; }

  // Best-effort: close in-app browser
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

  try {
    const u = new URL(url);
    const hasCode = !!u.searchParams.get('code');
    const hasHash = !!u.hash && u.hash.includes('access_token=');

    if (hasCode) {
      dlog('PKCE code detected, exchanging...');
      const { error } = await supabase.auth.exchangeCodeForSession(u.toString());
      if (error) {
        console.error('exchangeCodeForSession', error.message);
        dlog('Exchange failed', error);
        if (typeof window !== 'undefined') window.location.hash = '#/login';
        return;
      }
      dlog('PKCE exchange success');
    } else if (hasHash) {
      dlog('Implicit hash detected, using setSession');
      const params = new URLSearchParams(u.hash.slice(1)); // remove '#'
      const access_token = params.get('access_token') || '';
      const refresh_token = params.get('refresh_token') || '';
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) {
          console.error('setSession error', error.message);
          dlog('setSession failed', error);
          if (typeof window !== 'undefined') window.location.hash = '#/login';
          return;
        }
        dlog('setSession success');
      } else {
        dlog('Implicit hash missing tokens');
        if (typeof window !== 'undefined') window.location.hash = '#/login';
        return;
      }
    } else {
      dlog('No usable auth params in URL');
      if (typeof window !== 'undefined') window.location.hash = '#/login';
      return;
    }

    // Verify session and route
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id || null;
      dlog('getUser()', uid ? 'uid=' + uid : 'no-user');
      if (!uid) {
        if (typeof window !== 'undefined') window.location.hash = '#/login';
        return;
      }
      if (typeof window !== 'undefined') {
        dlog('Redirecting to /dashboard (hash)');
        window.location.hash = '#/dashboard';
      }
    } catch (userErr) {
      dlog('getUser() error, redirect to /dashboard anyway', userErr);
      if (typeof window !== 'undefined') window.location.hash = '#/dashboard';
    }
  } catch (e) {
    console.error('appUrlOpen handler', e);
    dlog('Fatal error in deep link handler', e);
    if (typeof window !== 'undefined') window.location.hash = '#/login';
  }
});
