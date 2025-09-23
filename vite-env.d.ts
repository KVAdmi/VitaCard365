/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_MP_PUBLIC_KEY: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_ENABLE_MP: string
  readonly VITE_MAPS_APP_KEY?: string;
  readonly VITE_MAPS_WEB_KEY?: string;
  readonly VITE_MAPS_API_KEY?: string;
  readonly VITE_GOOGLE_MAPS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
