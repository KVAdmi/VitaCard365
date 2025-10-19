import { Capacitor } from '@capacitor/core';
let Preferences: any = null;

async function ensurePreferences() {
  if (!Preferences) {
    try {
      // Carga perezosa para evitar fallar en web y evitar error de tipos en TS
      const pluginName = '@capacitor/preferences';
      // @ts-ignore - evitar chequeo de tipos del plugin en tiempo de build
      const mod: any = await import(/* @vite-ignore */ pluginName as any);
      Preferences = mod.Preferences;
    } catch {
      Preferences = null;
    }
  }
  return Preferences;
}

// Implementa la interfaz de storage que espera Supabase (getItem/setItem/removeItem)
export const SupabaseStorage = {
  async getItem(key: string) {
    try {
      if (Capacitor.getPlatform() !== 'web') {
        const P = await ensurePreferences();
        if (P) {
          const { value } = await P.get({ key });
          return value ?? null;
        }
      }
      return (typeof window !== 'undefined') ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string) {
    try {
      if (Capacitor.getPlatform() !== 'web') {
        const P = await ensurePreferences();
        if (P) {
          await P.set({ key, value });
          return;
        }
      }
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    } catch {}
  },
  async removeItem(key: string) {
    try {
      if (Capacitor.getPlatform() !== 'web') {
        const P = await ensurePreferences();
        if (P) {
          await P.remove({ key });
          return;
        }
      }
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    } catch {}
  }
};
