export type Medicion = {
  id: string;              // uuid
  ts: number;              // Date.now()
  source: 'manual' | 'ble';
  pesoKg?: number;
  sistolica?: number;
  diastolica?: number;
  pulsoBpm?: number;
  notas?: string;
};