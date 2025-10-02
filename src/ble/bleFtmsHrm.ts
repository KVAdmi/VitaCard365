// Parsers y utilidades para FTMS/HRM BLE
// Centraliza conversión de unidades y parsing binario
// Tipado estricto, sin any

// Servicios estándar
export const FTMS = '1826';
export const HRS  = '180D';
export const CHARS_FTMS = ['2AD2', '2ACD', '2AD1', '2ACE'];

// Tipos
export type LEScanResult = {
  deviceId: string;
  name: string;
  rssi?: number;
};

export type FtmsSample = {
  vel_kmh?: number;
  pace_s_km?: number;
  cad_rpm?: number;
  pot_w?: number;
  distancia_m?: number;
  kcal?: number;
  res_nivel?: number;
  inc_pct?: number;
};

export type HrSample = {
  hr_bpm: number;
};

/**
 * Parsea valor FTMS (binario) y normaliza unidades.
 * Devuelve solo campos presentes.
 */
export function parseFtms(buf: ArrayBuffer): FtmsSample {
  const d = new DataView(buf);
  let i = 0;
  const flags = d.getUint16(i, true); i += 2;
  let vel_kmh: number | undefined;
  let pace_s_km: number | undefined;
  let cad_rpm: number | undefined;
  let pot_w: number | undefined;
  let distancia_m: number | undefined;
  let kcal: number | undefined;
  let res_nivel: number | undefined;
  let inc_pct: number | undefined;
  if (flags & 0x0001) {
    const speed_m_s = d.getUint16(i, true) / 100; i += 2;
    vel_kmh = +(speed_m_s * 3.6).toFixed(2);
    if (vel_kmh > 0) {
      pace_s_km = +(3600 / vel_kmh).toFixed(2);
    }
  }
  if (flags & 0x0002) {
    cad_rpm = d.getUint16(i, true) / 2; i += 2;
  }
  if (flags & 0x0004) {
    pot_w = d.getInt16(i, true); i += 2;
  }
  if (flags & 0x0008) {
    distancia_m = d.getUint32(i, true); i += 4;
  }
  if (flags & 0x0010) {
    kcal = d.getUint16(i, true); i += 2;
  }
  if (flags & 0x0020) {
    res_nivel = d.getInt16(i, true); i += 2;
  }
  if (flags & 0x0040) {
    inc_pct = d.getInt16(i, true) / 10; i += 2;
  }
  const sample: FtmsSample = {};
  if (vel_kmh !== undefined) sample.vel_kmh = vel_kmh;
  if (pace_s_km !== undefined) sample.pace_s_km = pace_s_km;
  if (cad_rpm !== undefined) sample.cad_rpm = cad_rpm;
  if (pot_w !== undefined) sample.pot_w = pot_w;
  if (distancia_m !== undefined) sample.distancia_m = distancia_m;
  if (kcal !== undefined) sample.kcal = kcal;
  if (res_nivel !== undefined) sample.res_nivel = res_nivel;
  if (inc_pct !== undefined) sample.inc_pct = inc_pct;
  return sample;
}

/**
 * Parsea valor HRM (binario) y extrae bpm.
 */
export function parseHr(buf: ArrayBuffer): HrSample | null {
  const d = new DataView(buf);
  if (d.byteLength < 2) return null;
  const flags = d.getUint8(0);
  const hrUint16 = (flags & 0x01) !== 0;
  const hr_bpm = hrUint16 ? d.getUint16(1, true) : d.getUint8(1);
  return { hr_bpm };
}

// Nota: scanFtmsHr y la API pública deben importarse desde ble.ts, no desde aquí.
