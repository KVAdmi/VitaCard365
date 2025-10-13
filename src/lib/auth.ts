import { App } from '@capacitor/app';
import { supabase } from './supabaseClient';

// Nuevo deep link estándar solicitado
export const DEEP_LINK = 'vitacard365://auth-callback';

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
  const normalized = url.split('?')[0];
  const isNew = url.startsWith(DEEP_LINK);
  const isOld = normalized === 'vitacard365://auth/callback';
  if (!isNew && !isOld) return;
  try {
    // Cerrar pestaña de navegador si el plugin está disponible, sin requerir @capacitor/browser en build web
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const maybeBrowser: any = (globalThis as any).Capacitor?.Plugins?.Browser;
      if (maybeBrowser?.close) {
        await maybeBrowser.close();
      }
    } catch {}
    const { error } = await supabase.auth.exchangeCodeForSession(url);
    if (error) {
      console.error('exchangeCodeForSession', error.message);
      return;
    }
    // TODO: Integrar router real. Por ahora, usa hash para nativo si aplica.
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id || null;
      if (!uid) {
        if (typeof window !== 'undefined') window.location.hash = '#/login';
        return;
      }
      // Destino básico al Home; reemplazar por tu ruta real
      if (typeof window !== 'undefined') window.location.hash = '#/dashboard';
    } catch {
      if (typeof window !== 'undefined') window.location.hash = '#/dashboard';
    }
  } catch (e) {
    console.error('appUrlOpen handler', e);
  }
});
