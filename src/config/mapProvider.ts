// src/config/mapProvider.ts
// Resolución de provider por plataforma usando flags de entorno

type Provider = 'web' | 'native';

export function getMapProvider(platform: 'android' | 'ios' | 'web'): Provider {
  const env = import.meta.env as any;
  const ANDROID = (env.VITE_MAP_PROVIDER_ANDROID as string | undefined)?.toLowerCase();
  const IOS = (env.VITE_MAP_PROVIDER_IOS as string | undefined)?.toLowerCase();

  if (platform === 'android') {
    return (ANDROID === 'native' || ANDROID === 'web') ? (ANDROID as Provider) : 'web';
  }
  if (platform === 'ios') {
    return (IOS === 'native' || IOS === 'web') ? (IOS as Provider) : 'native';
  }
  // Plataforma web (navegador) siempre usa JS
  return 'web';
}

export function getMapsApiKey(provider: Provider, platform: 'android' | 'ios' | 'web'): string | undefined {
  const env = import.meta.env as any;
  if (provider === 'web') {
    return env.VITE_MAPS_WEB_KEY || env.VITE_MAPS_API_KEY || env.VITE_GOOGLE_MAPS_KEY;
  }
  // nativo (solo iOS por decisión ejecutiva)
  if (platform === 'ios') {
    return env.VITE_MAPS_IOS_KEY || env.VITE_MAPS_APP_KEY || env.VITE_MAPS_API_KEY || env.VITE_GOOGLE_MAPS_KEY;
  }
  return undefined;
}
