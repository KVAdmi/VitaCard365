/// <reference types="vite/client" />
/// <reference types="@types/google.maps" />

// Claves de Vite disponibles en runtime
interface ImportMetaEnv {
  readonly VITE_MAPS_WEB_KEY: string;
  readonly VITE_MAPS_APP_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Para que TS sepa que window.google existe cuando el script carga
declare global {
  interface Window {
    google: typeof google | any; // usa los tipos si están, y cae a any si no
  }
}

export {};
