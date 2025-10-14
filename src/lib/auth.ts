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
  const normalized = url.split('?')[0];
  const isNew = url.startsWith(DEEP_LINK);
  const isOld = normalized === 'vitacard365://auth/callback';
  if (!isNew && !isOld) { dlog('Ignoring non-auth URL'); return; }
  try {
    // Close in-app browser if present (Capacitor Browser plugin) – best‑effort
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const maybeBrowser: any = (globalThis as any).Capacitor?.Plugins?.Browser;
      if (maybeBrowser?.close) {
        dlog('Closing in-app browser');
        await maybeBrowser.close();
      } else {
        dlog('No Browser plugin available to close');
      }
    } catch (closeErr) {
      dlog('Browser close attempt failed (non-fatal)', closeErr);
    }

    dlog('Exchanging code for session...');
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(url);
    if (exchangeError) {
      console.error('exchangeCodeForSession', exchangeError.message);
      dlog('Exchange failed', exchangeError);
      return;
    }
    dlog('Exchange success');

    // Optional: Inspect immediate session (may rely on internal listeners)
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      dlog('Post-exchange getSession()', !!sessionData?.session, sessionData?.session?.user?.id);
    } catch (sessErr) {
      dlog('getSession() error (non-fatal)', sessErr);
    }

    // Fetch user explicitly
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id || null;
      dlog('getUser()', uid ? 'uid=' + uid : 'no-user');
      if (!uid) {
        if (typeof window !== 'undefined') {
          dlog('Redirecting to /login (hash) due to missing uid');
          window.location.hash = '#/login';
        }
        return;
      }
      // NOTE: Keep existing hash routing to avoid breaking current navigation while debugging
      if (typeof window !== 'undefined') {
        dlog('Redirecting to /dashboard (hash)');
        window.location.hash = '#/dashboard';
      }
    } catch (userErr) {
      dlog('getUser() threw, fallback redirect to /dashboard', userErr);
      if (typeof window !== 'undefined') window.location.hash = '#/dashboard';
    }
  } catch (e) {
    console.error('appUrlOpen handler', e);
    dlog('Fatal error in deep link handler', e);
  }
});
