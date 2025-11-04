import { Capacitor } from '@capacitor/core';

// Lazy import to avoid bundling errors on web
async function getAppPlugin() {
  try {
    const mod: any = await import('@capacitor/app');
    return mod.App;
  } catch {
    return null;
  }
}

// Lightweight session check without React
import { supabase } from './supabaseClient';

async function isAuthenticated(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data?.session?.user;
  } catch {
    return false;
  }
}

async function initBackButtonGuard() {
  if (!Capacitor.isNativePlatform()) return;
  const App = await getAppPlugin();
  if (!App) return;

  // Single subscription
  App.addListener('backButton', async ({ canGoBack }: { canGoBack: boolean }) => {
    const authed = await isAuthenticated();

    // If user is authenticated, never exit app on back; route to dashboard when at root
    if (authed) {
      try {
        if (canGoBack && typeof window !== 'undefined') {
          // Let the WebView navigate back normally
          window.history.back();
        } else {
          // At root: keep user inside and ensure dashboard is visible
          if (typeof window !== 'undefined') {
            // Prefer hash for robustness in file://
            window.location.hash = '#/dashboard';
          }
        }
      } catch {}
      return; // swallow default exit behavior
    }

    // If not authenticated: default behavior
    try {
      if (canGoBack && typeof window !== 'undefined') {
        window.history.back();
      } else {
        // Allow exiting the app on login/onboarding screens
        App.exitApp();
      }
    } catch {}
  });
}

async function initAppStateHydration() {
  if (!Capacitor.isNativePlatform()) return;
  const App = await getAppPlugin();
  if (!App) return;

  App.addListener('appStateChange', async ({ isActive }: { isActive: boolean }) => {
    // On resume, ensure session is present (non-blocking)
    if (isActive) {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
          // No session found; nothing to enforce here—guards will redirect if needed
        }
        // Si la app vuelve al foreground estando en la Intro, navega a /descubre para evitar pantalla azul
        if (typeof window !== 'undefined') {
          const hash = window.location.hash || '';
          const path = window.location.pathname || '';
          const atIntro = hash === '#/' || hash === '#' || hash === '' || path === '/' || path.endsWith('/index.html');
          if (atIntro) {
            try { window.location.hash = '#/descubre'; } catch {}
          }
        }
      } catch {}
    }
  });
}

// Initialize eagerly
(async () => {
  try {
    await initBackButtonGuard();
    await initAppStateHydration();
  } catch (e) {
    // non-fatal
    try { console.warn('[nativeGuards] init failed', e); } catch {}
  }
})();
