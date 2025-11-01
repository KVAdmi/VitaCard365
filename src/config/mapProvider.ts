// src/config/mapProvider.ts
// Resolución de provider por plataforma usando flags de entorno

type Provider = 'web' | 'native';

export function getMapProvider(platform: 'android' | 'ios' | 'web'): Provider {
  const env = import.meta.env as any;
  const ANDROID = (env.VITE_MAP_PROVIDER_ANDROID as string | undefined)?.toLowerCase();
  const IOS = (env.VITE_MAP_PROVIDER_IOS as string | undefined)?.toLowerCase();

  if (platform === 'android') {
    // Hard-force web on Android to avoid any native SDK usage and related crashes
    // regardless of build-time flags.
    return 'web';
  }
  if (platform === 'ios') {
    // Forzamos web en iOS para evitar el plugin nativo de Google Maps.
    // Si en algún momento se desea volver a nativo, ajustar esta línea o usar VITE_MAP_PROVIDER_IOS=native.
    return 'web';
  }
  // Plataforma web (navegador) siempre usa JS
  return 'web';
}


// Solo para Android: retorna la key de WebView Android
export const getMapsWebKey = (platform: 'android') => {
  if (platform === 'android') {
    return (import.meta.env.VITE_MAPS_ANDROID_WEBVIEW_KEY || '').trim();
  }
  return '';
};
