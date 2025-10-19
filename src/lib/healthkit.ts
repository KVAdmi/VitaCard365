// healthkit.ts (opcional): wrapper mínimo por si hay plugin disponible
// Evita romper en Android o iOS sin capability. Nos limitamos a detección y stubs.

export type HKPermission = 'heartRate';

type PluginInfo = { plugin: any; kind: 'capacitor' | 'cordova' };

function getPluginInfo(): PluginInfo | null {
  const w = window as any;
  const cap = w?.Capacitor;
  const p = cap?.Plugins || {};
  // Try common plugin ids
  const capPlugin = p.HealthKit || p.CapacitorHealthkit || p.Healthkit || null;
  if (capPlugin) return { plugin: capPlugin, kind: 'capacitor' };
  // Cordova plugin (cordova-plugin-health) attaches to window.plugins.health
  const cordovaHealth = w?.plugins?.health;
  if (cordovaHealth) return { plugin: cordovaHealth, kind: 'cordova' };
  return null;
}

export async function requestPermissions(perms: HKPermission[] = ['heartRate']): Promise<boolean> {
  try {
    const info = getPluginInfo();
    if (!info) return false;
    const { plugin, kind } = info;
    if (kind === 'capacitor' && typeof plugin.requestAuthorization === 'function') {
      const res = await plugin.requestAuthorization({
        read: ['HKQuantityTypeIdentifierHeartRate', 'heartRate'],
        write: [],
      });
      return res === true || res?.granted === true || res?.status === 'granted';
    }
    if (kind === 'cordova' && (window as any).plugins?.health) {
      const h = (window as any).plugins.health;
      const ok: boolean = await new Promise((resolve) => {
        try {
          h.requestAuthorization(['heart_rate'], () => resolve(true), () => resolve(false));
        } catch { resolve(false); }
      });
      return ok;
    }
    return false;
  } catch {
    return false;
  }
}

export async function getLatestHeartRate(): Promise<{ bpm: number; ts: number } | null> {
  try {
    const info = getPluginInfo();
    if (!info) return null;
    const { plugin, kind } = info;
    // Prefer a direct "most recent" API if available
    if (typeof plugin.getMostRecentQuantitySample === 'function') {
      const r = await plugin.getMostRecentQuantitySample({
        sampleType: 'HKQuantityTypeIdentifierHeartRate',
      });
      const bpm = Number(r?.quantity ?? r?.value);
      const ts = new Date(r?.startDate || r?.endDate || Date.now()).getTime();
      if (Number.isFinite(bpm)) return { bpm, ts };
    }
    // Fallbacks: query by samples (
    if (typeof plugin.queryQuantitySamples === 'function') {
      const now = Date.now();
      const start = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const end = new Date(now).toISOString();
      const r = await plugin.queryQuantitySamples({
        sampleType: 'HKQuantityTypeIdentifierHeartRate',
        unit: 'count/min',
        startDate: start,
        endDate: end,
        limit: 1,
        ascending: false,
      });
      const item = Array.isArray(r?.results) ? r.results[0] : null;
      if (item) {
        const bpm = Number(item?.quantity ?? item?.value);
        const ts = new Date(item?.startDate || item?.endDate || Date.now()).getTime();
        if (Number.isFinite(bpm)) return { bpm, ts };
      }
    }
    // Cordova cordova-plugin-health query
    if (kind === 'cordova' && (window as any).plugins?.health) {
      const h = (window as any).plugins.health;
      const now = Date.now();
      const start = new Date(now - 24 * 60 * 60 * 1000);
      const latest = await new Promise<any | null>((resolve) => {
        try {
          h.query({
            startDate: start,
            endDate: new Date(now),
            dataType: 'heart_rate',
            limit: 1,
          }, (data: any[]) => resolve(Array.isArray(data) && data.length ? data[data.length - 1] : null), () => resolve(null));
        } catch { resolve(null); }
      });
      if (latest) {
        const bpm = Number(latest?.value ?? latest?.quantity);
        const ts = new Date(latest?.startDate || latest?.endDate || Date.now()).getTime();
        if (Number.isFinite(bpm)) return { bpm, ts };
      }
    }
    // Legacy shape used in earlier wrapper
    if (typeof plugin.querySampleType === 'function') {
      const res = await plugin.querySampleType({
        sampleType: 'heartRate',
        limit: 1,
        sort: 'desc',
      });
      const item = Array.isArray(res?.results) ? res.results[0] : null;
      if (item) {
        const bpm = Number(item.value);
        const ts = new Date(item.startDate || item.endDate || Date.now()).getTime();
        if (Number.isFinite(bpm)) return { bpm, ts };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function watchHeartRate(onData: (d: { bpm: number; ts: number }) => void): Promise<() => void> {
  // Implementación ideal: Anchored Object Query + background delivery
  // Aquí hacemos un pull periódico como fallback para la demo
  let timer: any;
  const tick = async () => {
    const latest = await getLatestHeartRate();
    if (latest) onData(latest);
  };
  await tick();
  timer = setInterval(tick, 5000);
  return () => { if (timer) clearInterval(timer); };
}
