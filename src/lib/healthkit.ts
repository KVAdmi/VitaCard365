// healthkit.ts (opcional): wrapper mínimo por si hay plugin disponible
// Evita romper en Android o iOS sin capability. Nos limitamos a detección y stubs.

export type HKPermission = 'heartRate';

function hasPlugin() {
  return typeof (window as any).Capacitor !== 'undefined' && !!(window as any).Capacitor.Plugins?.HealthKit;
}

export async function requestPermissions(perms: HKPermission[] = ['heartRate']): Promise<boolean> {
  try {
    if (!hasPlugin()) return false;
    const { HealthKit } = (window as any).Capacitor.Plugins;
    const res = await HealthKit.requestAuthorization({
      read: ['heartRate'],
      write: [],
    });
    return !!res?.granted;
  } catch {
    return false;
  }
}

export async function getLatestHeartRate(): Promise<{ bpm: number; ts: number } | null> {
  try {
    if (!hasPlugin()) return null;
    const { HealthKit } = (window as any).Capacitor.Plugins;
    const res = await HealthKit.querySampleType({
      sampleType: 'heartRate',
      limit: 1,
      sort: 'desc',
    });
    const item = Array.isArray(res?.results) ? res.results[0] : null;
    if (!item) return null;
    const bpm = Number(item.value);
    const ts = new Date(item.startDate || item.endDate || Date.now()).getTime();
    if (!Number.isFinite(bpm)) return null;
    return { bpm, ts };
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
