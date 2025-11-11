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
const ENV_DEEP_LINK = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_DEEP_LINK) as string | undefined;
const isNative = !!(Capacitor.isNativePlatform && Capacitor.isNativePlatform());
export const DEEP_LINK: string = ENV_DEEP_LINK
  || (isNative ? 'com.vitacard.app://auth-callback' : 'vitacard365://auth/callback');

export async function signInWithGoogle() {
  if (isNative) {
    // En nativo, usar el deep link scheme
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: DEEP_LINK, skipBrowserRedirect: true },
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
  // En web, usar el callback web
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: false },
  });
  if (error) console.error('signInWithOAuth (web)', error.message);
}

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
  } catch (e) {
    console.error('[appUrlOpen][catch]', e);
  }
});
