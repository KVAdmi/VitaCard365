export async function getDeviceId(): Promise<string> {
  try {
    // @ts-ignore - dynamic import para que no truene en web
    const { Preferences } = await import('@capacitor/preferences');
    const k = 'kv_device_id';
    const got = await Preferences.get({ key: k });
    if (got.value) return got.value;
    const gen = crypto.randomUUID();
    await Preferences.set({ key: k, value: gen });
    return gen;
  } catch (_) {
    // 2) localStorage
    try {
      const k = 'kv_device_id';
      const got = localStorage.getItem(k);
      if (got) return got;
      const gen = crypto.randomUUID();
      localStorage.setItem(k, gen);
      return gen;
    } catch {
      // 3) fallback
      return crypto.randomUUID();
    }
  }
}