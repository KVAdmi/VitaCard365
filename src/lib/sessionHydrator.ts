// Session hydrator: ensures Supabase restores a session from storage on app startup
// Works on native (Capacitor Preferences) and web (localStorage)

import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';

type StoredAuth = {
  currentSession?: {
    access_token?: string;
    refresh_token?: string;
  } | null;
  access_token?: string; // legacy shape
  refresh_token?: string; // legacy shape
};

async function readStorage(key: string): Promise<string | null> {
  try {
    // Try Capacitor Preferences on native
    if (Capacitor.getPlatform() !== 'web') {
      try {
        const mod: any = await import('@capacitor/preferences');
        const { value } = await mod.Preferences.get({ key });
        if (value) return value;
      } catch {}
    }
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key);
    }
  } catch {}
  return null;
}

async function tryHydrateOnce() {
  try {
    // If Supabase already has a session, nothing to do
    const { data } = await supabase.auth.getSession();
    if (data?.session) return;

    // Try known keys
    const keys = ['vita-auth', 'supabase.auth.token'];
    for (const k of keys) {
      const raw = await readStorage(k);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as StoredAuth | { data?: StoredAuth };
        const payload: StoredAuth = (parsed as any)?.data ?? parsed ?? {};
        const access_token = payload.currentSession?.access_token || (payload as any)?.access_token || undefined;
        const refresh_token = payload.currentSession?.refresh_token || (payload as any)?.refresh_token || undefined;
        if (refresh_token) {
          // setSession will refresh tokens if needed
          await supabase.auth.setSession({ access_token: access_token || '', refresh_token });
          break;
        }
      } catch {}
    }
  } catch (e) {
    // non-fatal
    console.warn('[sessionHydrator] hydrate failed', e);
  }
}

// Fire-and-forget at module load
void tryHydrateOnce();
