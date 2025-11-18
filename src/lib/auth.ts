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

export async function signInWithGoogle(context = 'login') {
  // Guardar contexto para que AuthCallback sepa de dónde viene
  if (context) {
    localStorage.setItem('oauth_context', context);
  }
  if (isNative) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: DEEP_LINK,
        skipBrowserRedirect: false,
        queryParams: { prompt: 'select_account' }
      },
    });
    if (error) console.error('signInWithOAuth (native)', error.message);
    return;
  }
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: false,
      queryParams: { prompt: 'select_account' }
    },
  });
  if (error) console.error('signInWithOAuth (web)', error.message);
}

let AUTH_DEEPLINK_HANDLED = false;

// Best-effort: cerrar el in-app browser si estaba abierto
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

// Extrae code/tokens de query o hash y los aplica
export async function hydrateSessionFromUrlParams(u: URL) {
  // code puede venir en query o en hash (#code=...)
  const codeFromQuery = u.searchParams.get('code');
  const codeFromHash = u.hash ? (u.hash.match(/(?:[?#]|^)code=([^&]+)/)?.[1] || null) : null;
  const code = codeFromQuery || codeFromHash;
  if (code) {
    dlog('Exchanging code for session');
    await supabase.auth.exchangeCodeForSession(code);
    return true;
  }

  // Recovery tokens suelen venir en hash
  const at = u.searchParams.get('access_token') || (u.hash && u.hash.match(/(?:[?#]|^)access_token=([^&]+)/)?.[1]);
  const rt = u.searchParams.get('refresh_token') || (u.hash && u.hash.match(/(?:[?#]|^)refresh_token=([^&]+)/)?.[1]);
  if (at && rt) {
    dlog('Setting session from access/refresh tokens');
    await supabase.auth.setSession({ access_token: at, refresh_token: rt });
    return true;
  }

  dlog('No code/tokens found in URL; proceeding without hydration');
  return false;
}

async function handleInboundUrl(url: string) {
  if (!url) return;

  // Evitar doble manejo (el SO puede disparar launch + appUrlOpen)
  if (AUTH_DEEPLINK_HANDLED) { dlog('Deep link already handled, skipping'); return; }
  AUTH_DEEPLINK_HANDLED = true;

  try {
    dlog('Inbound deep link', url);
    const u = new URL(url);

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
      return;
    }

    if (isRecovery) {
      await hydrateSessionFromUrlParams(u);
      if (typeof window !== 'undefined') {
        // Muestra formulario de nueva contraseña dentro de la app
        window.location.hash = '#/reset-password?stage=update';
      }
      return;
    }

    dlog('Ignoring non-auth URL', url);
  } catch (e) {
    console.error('handleInboundUrl', e);
    dlog('Fatal error in deep link handler', e);
    if (typeof window !== 'undefined') window.location.replace('#/login');
  } finally {
    // Permite nueva captura si el SO emite eventos seguidos
    setTimeout(() => { AUTH_DEEPLINK_HANDLED = false; }, 1000);
  }
}

// 1) Manejo cuando la app YA está abierta
App.addListener('appUrlOpen', async ({ url }: { url: string }) => {
  await handleInboundUrl(url);
});

// 2) Manejo de COLD START: si la app se abre por deep link desde cerrada
(async () => {
  try {
    const launch = await App.getLaunchUrl();
    const launchUrl = (launch as any)?.url as string | undefined;
    if (launchUrl) {
      dlog('Launch URL detected', launchUrl);
      await handleInboundUrl(launchUrl);
    } else {
      dlog('No launch URL');
    }
  } catch (e) {
    dlog('getLaunchUrl failed (non-fatal)', e);
  }
})();