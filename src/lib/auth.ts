import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';

// Debug flag
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const DEBUG_AUTH: boolean = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_DEBUG_AUTH === '1';
  } catch { return false; }
})();
const dlog = (...args: unknown[]) => { if (DEBUG_AUTH) console.log('[AUTH-DL]', ...args); };

// Deep links oficiales confirmados
const AUTH_CALLBACK = 'vitacard365://auth/callback';
const AUTH_RECOVERY = 'vitacard365://auth/recovery';

// En nativo usamos deep link; en web el origen actual
const isNative = !!(Capacitor.isNativePlatform && Capacitor.isNativePlatform());
export const DEEP_LINK = AUTH_CALLBACK;

export async function signInWithGoogle() {
  const webRedirect =
    (typeof window !== 'undefined' && window.location?.origin)
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

async function tryCloseInAppBrowser() {
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
}

async function hydrateSessionFromUrlParams(u: URL) {
  const code = u.searchParams.get('code');
  if (code) {
    dlog('Exchanging code for session');
    await supabase.auth.exchangeCodeForSession(code);
    return true;
  }
  const at = u.searchParams.get('access_token') || u.hash.match(/access_token=([^&]+)/)?.[1];
  const rt = u.searchParams.get('refresh_token') || u.hash.match(/refresh_token=([^&]+)/)?.[1];
  if (at && rt) {
    dlog('Setting session from access/refresh tokens');
    await supabase.auth.setSession({ access_token: at, refresh_token: rt });
    return true;
  }
  dlog('No code/tokens found in URL; proceeding without hydration');
  return false;
}

App.addListener('appUrlOpen', async ({ url }: { url: string }) => {
  if (!url) return;

  if (AUTH_DEEPLINK_HANDLED) { dlog('Deep link already handled, skipping'); return; }
  AUTH_DEEPLINK_HANDLED = true;

  try {
    dlog('Inbound deep link', url);
    const u = new URL(url);

    const isAuthCallback =
      (u.protocol === 'vitacard365:' && u.host === 'auth' && u.pathname === '/callback') ||
      (u.protocol === 'vitacard365:' && u.host === 'auth-callback'); // compat legacy

    const isRecovery =
      (u.protocol === 'vitacard365:' && u.host === 'auth' && u.pathname === '/recovery');

    await tryCloseInAppBrowser();

    if (isAuthCallback) {
      await hydrateSessionFromUrlParams(u);
      if (typeof window !== 'undefined') {
        window.location.hash = '#/auth/callback';
      }
      return;
    }

    if (isRecovery) {
      await hydrateSessionFromUrlParams(u);
      if (typeof window !== 'undefined') {
        window.location.hash = '#/reset-password?stage=update';
      }
      return;
    }

    dlog('Ignoring non-auth URL', url);
  } catch (e) {
    console.error('appUrlOpen handler', e);
    dlog('Fatal error in deep link handler', e);
    if (typeof window !== 'undefined') window.location.replace('#/login');
  } finally {
    setTimeout(() => { AUTH_DEEPLINK_HANDLED = false; }, 1000);
  }
});