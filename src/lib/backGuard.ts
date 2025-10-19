import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { supabase } from '@/lib/supabaseClient';

declare global {
  interface Window { __vitaBackGuard?: boolean }
}

export function initBackGuard() {
  try {
    if (typeof window === 'undefined') return;
    if (window.__vitaBackGuard) return; // evitar múltiples registros
    const isNative = (typeof Capacitor?.isNativePlatform === 'function' && Capacitor.isNativePlatform());
    if (!isNative) return;

  App.addListener('backButton', async ({ canGoBack }: { canGoBack: boolean }) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isAuth = !!session;
        if (isAuth) {
          if (canGoBack) {
            window.history.back();
            return;
          }
          // En raíz: no cerrar app. Llévalo al dashboard si no está ahí.
          const href = (typeof window !== 'undefined' && (window.location.hash || window.location.pathname)) || '';
          const path = href.startsWith('#') ? href.slice(1) : href;
          if (!path.startsWith('/dashboard')) {
            // Fuerza HashRouter en nativo
            try { window.location.hash = '#/dashboard'; } catch {}
          }
          // No llamar a App.exitApp(): prevenimos cierre hasta logout
          return;
        }

        // Usuario no autenticado: comportamiento estándar
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      } catch {
        // Fallback seguro: no cerrar de golpe si hay dudas
        if (canGoBack) window.history.back();
      }
    });

    window.__vitaBackGuard = true;
  } catch {}
}

// Auto-init por conveniencia en import
try { initBackGuard(); } catch {}
