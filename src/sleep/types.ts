export type SleepSession = {
  id: string;
  source: 'manual' | 'ble' | 'auto';
  startTs: number;       // epoch ms
  endTs: number;         // epoch ms
  durationMin: number;   // redondeado
  awakenings?: number;   // opcional
  notes?: string;
  score?: number;        // opcional 0–100
};