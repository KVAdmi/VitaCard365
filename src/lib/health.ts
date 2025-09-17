// src/lib/health.ts

type Health = any; // cordova.plugins.health (tipado simple por ahora)

const H = (): Health => (window as any).cordova?.plugins?.health;

export async function ensureHealthConnectInstalledAndroid(): Promise<void> {
  if (!H()) return;
  try {
    // Android: abre Play Store para instalar Health Connect si falta
    await H().getHealthConnectFromStore(
      () => {},
      () => {}
    );
  } catch {}
}

export async function requestHealthPermissions(): Promise<void> {
  if (!H()) throw new Error("Health plugin no disponible");
  // Pide solo lo necesario
  const read = [
    "heart_rate",
    "sleep",           // devuelve sesiones + fases en Android (HC)
    "steps",
    // "oxygen_saturation", // opcional según cobertura
  ];
  await new Promise<void>((resolve, reject) =>
    H().requestAuthorization(
      [{ read }], // también puedes pedir write si grabas datos
      () => resolve(),
      (err: any) => reject(new Error(String(err)))
    )
  );
}

export async function readHeartRateToday(): Promise<{ bpm: number; date: Date; sourceName?: string }[]> {
  if (!H()) return [];
  const start = startOfDay();
  const end = new Date();
  return await new Promise((resolve, reject) =>
    H().query(
      { startDate: start, endDate: end, dataType: "heart_rate" },
      (data: any[]) =>
        resolve(
          (data || []).map(d => ({
            bpm: Number(d.value),
            date: new Date(d.startDate || d.date || d.endDate),
            sourceName: d.sourceName
          }))
        ),
      (err: any) => reject(new Error(String(err)))
    )
  );
}

export async function readStepsToday(): Promise<number> {
  if (!H()) return 0;
  const start = startOfDay();
  const end = new Date();
  return await new Promise((resolve, reject) =>
    H().queryAggregated(
      { startDate: start, endDate: end, dataType: "steps", bucket: "day" },
      (res: any) => resolve(Number(res.value || 0)),
      (err: any) => reject(new Error(String(err)))
    )
  );
}

export type SleepStage =
  | "sleep.light" | "sleep.deep" | "sleep.rem" | "sleep.awake" | "sleep.outOfBed" | "sleep.undefined";

export async function readSleepLastNight(): Promise<{
  start: Date; end: Date; stages: { start: Date; end: Date; stage: SleepStage }[];
}> {
  if (!H()) throw new Error("Health plugin no disponible");
  const { start, end } = lastNightWindow();

  return await new Promise((resolve, reject) =>
    H().query(
      { startDate: start, endDate: end, dataType: "sleep" },
      (items: any[]) => {
        // Unifica a una sola sesión y lista fases si vienen (HC trae stages)
        const sorted = (items || []).sort((a,b)=> new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        const s = sorted.length ? new Date(sorted[0].startDate) : start;
        const e = sorted.length ? new Date(sorted[sorted.length-1].endDate) : end;
        const stages = sorted.map(it => ({
          start: new Date(it.startDate),
          end: new Date(it.endDate),
          stage: (it.stage || "sleep.undefined") as SleepStage
        }));
        resolve({ start: s, end: e, stages });
      },
      (err: any) => reject(new Error(String(err)))
    )
  );
}

// Helpers
function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}
function lastNightWindow() {
  const end = new Date();
  end.setHours(8,0,0,0); // 8am hoy
  const start = new Date(end);
  start.setDate(start.getDate() - 1);
  return { start, end };
}
