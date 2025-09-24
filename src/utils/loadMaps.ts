
import { Capacitor } from '@capacitor/core';

let gmapsPromise: Promise<typeof google> | null = null;

export function loadMaps(): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('No window'));
  }

  // Ya cargado
  // @ts-ignore
    if (window.google?.maps) {
    // @ts-ignore
      return Promise.resolve(window.google);
  }

  // En curso
  if (gmapsPromise) return gmapsPromise;

  const apiKey = Capacitor.isNativePlatform()
    ? import.meta.env.VITE_MAPS_APP_KEY
    : import.meta.env.VITE_MAPS_WEB_KEY;

  if (!apiKey) return Promise.reject(new Error('Google Maps API key missing'));

  // Reusar script si ya existe
  const existing = document.querySelector<HTMLScriptElement>('script[data-gmaps-loader="1"]');
  if (existing) {
    gmapsPromise = new Promise((resolve, reject) => {
      existing.addEventListener('load', () => {
        // @ts-ignore
          window.google?.maps ? resolve(window.google) : reject(new Error('Google Maps failed to initialize'));
      });
      existing.addEventListener('error', () => reject(new Error('Google Maps script error')));
    });
    return gmapsPromise;
  }

  // Crear script único
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
  s.async = true;
  s.defer = true;
  s.setAttribute('data-gmaps-loader', '1');

  console.log('[Maps] platform=', Capacitor.getPlatform());
  console.log('[Maps] url=', s.src);

  gmapsPromise = new Promise((resolve, reject) => {
    s.onload = () => {
      // @ts-ignore
        window.google?.maps ? resolve(window.google) : reject(new Error('Google Maps failed to initialize'));
    };
    s.onerror = () => reject(new Error('Google Maps script error'));
  });

  document.head.appendChild(s);
  return gmapsPromise;
}
