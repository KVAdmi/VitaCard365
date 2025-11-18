// src/lib/rememberMe.ts
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'vitacard365_remember_me';

export type RememberMeData = {
  email: string;
  rememberEmail: boolean;
  keepSession: boolean;
};

function isNative() {
  return !!(window && window.Capacitor && window.Capacitor.isNativePlatform);
}

export async function saveRememberMe(data: RememberMeData) {
  const json = JSON.stringify(data);
  if (isNative()) {
    await Preferences.set({ key: STORAGE_KEY, value: json });
  } else {
    localStorage.setItem(STORAGE_KEY, json);
  }
}

export async function loadRememberMe(): Promise<RememberMeData> {
  if (isNative()) {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (value) return JSON.parse(value);
  } else {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value) return JSON.parse(value);
  }
  return { email: '', rememberEmail: false, keepSession: false };
}

export async function clearRememberMe() {
  if (isNative()) {
    await Preferences.remove({ key: STORAGE_KEY });
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}
