import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';

/** Devuelve un deviceId estable, persistido en Preferences y respaldado en localStorage. */
export async function getStableDeviceId(): Promise<string> {
  // intenta Preferences primero
  const saved = await Preferences.get({ key: 'device_id' });
  if (saved.value) {
    localStorage.setItem('device_id', saved.value); // backup web
    return saved.value;
  }
  // fallback web
  const web = localStorage.getItem('device_id');
  if (web) {
    await Preferences.set({ key: 'device_id', value: web });
    return web;
  }
  // generar nuevo
  const { identifier } = await Device.getId();
  const id = identifier || crypto.randomUUID();
  await Preferences.set({ key: 'device_id', value: id });
  localStorage.setItem('device_id', id);
  return id;
}