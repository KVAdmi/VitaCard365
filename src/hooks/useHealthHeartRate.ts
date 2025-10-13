// Hook React para HR desde HealthKit (iOS). Seguro en Android porque hace no-op.
import { useEffect, useState } from 'react';
import { requestPermissions, watchHeartRate } from '@/lib/healthkit';

export function useHealthHeartRate(enabled: boolean) {
  const [bpm, setBpm] = useState<number | null>(null);
  const [ts, setTs] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stop: (() => void) | null = null;
    (async () => {
      if (!enabled) return;
      const ok = await requestPermissions(['heartRate']);
      if (!ok) { setReady(false); return; }
      setReady(true);
      stop = await watchHeartRate((d) => { setBpm(d.bpm); setTs(d.ts); });
    })();
    return () => { if (stop) stop(); };
  }, [enabled]);

  return { bpm, ts, ready };
}
