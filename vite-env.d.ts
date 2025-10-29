/// <reference types="vite/client" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_MP_PUBLIC_KEY: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_ENABLE_MP: string
  readonly VITE_MAPS_WEB_KEY?: string;
  readonly VITE_MAPS_API_KEY?: string;
  readonly VITE_GOOGLE_MAPS_KEY?: string;
  readonly VITE_MAPS_IOS_KEY?: string;
  readonly VITE_MAP_PROVIDER_ANDROID?: 'web' | 'native' | string;
  readonly VITE_MAP_PROVIDER_IOS?: 'web' | 'native' | string;
  // Map provider flags are resolved at runtime; Android is forced to 'web' by code.
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
