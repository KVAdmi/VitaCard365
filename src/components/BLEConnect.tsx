import { useState } from 'react';
import { supabase } from "@/lib/supabaseClient";

// Tipos para Web Bluetooth API
declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
    };
  }

  interface RequestDeviceOptions {
    filters?: Array<{ services?: Array<number | string> }>;
    optionalServices?: Array<number | string>;
    acceptAllDevices?: boolean;
  }

  interface BluetoothDevice {
    gatt?: {
      connect(): Promise<BluetoothRemoteGATTServer>;
    };
    addEventListener(type: string, listener: EventListener): void;
  }

  interface BluetoothRemoteGATTServer {
    getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
    disconnect(): void;
  }

  interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
    readValue(): Promise<DataView>;
    value?: DataView;
  }
}

type Saved = {
  sistolica?: number | null;
  diastolica?: number | null;
  pulso_bpm?: number | null;
  spo2?: number | null;
  peso_kg?: number | null;
  source: "ble";
};

// Variables para control de duplicados y rate limiting
let lastBPKey = "";
let lastHRSave = 0;
const HR_SAVE_MS = 5000;

export function useBLEVitals() {
  const [isConnecting, setIsConnecting] = useState(false);
  
  async function getUserId() {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;
    if (!uid) throw new Error("No hay sesión");
    return uid;
  }

  function ensureBLE() {
    if (!navigator.bluetooth) {
      throw new Error("Web Bluetooth no está disponible en este navegador.");
    }
  }

  // Función para evitar duplicados en mediciones de presión arterial
  function dedupeBP({ systolic, diastolic, pulse }: {systolic?:number; diastolic?:number; pulse?:number}) {
    const key = [systolic ?? "x", diastolic ?? "x", pulse ?? "x"].join("-");
    if (key === lastBPKey) return true; // duplicado
    lastBPKey = key;
    return false;
  }

  // ---------- 0x1810 Blood Pressure Service ----------
  async function connectBloodPressure() {
    ensureBLE();
    setIsConnecting(true);
    
    const controller = new AbortController();
    
    try {
      // Modo discovery para debug
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "blood_pressure",   // 0x1810
          "heart_rate",       // 0x180D
          "device_information"
        ]
      });

      const server = await device.gatt!.connect();
      
      // Debug: listar servicios
      const services = await server.getPrimaryServices();
      for (const s of services) {
        console.log("Service", s.uuid);
        const chars = await s.getCharacteristic();
        for (const c of chars) console.log("  Char", c.uuid);
      }
      
      const service = await server.getPrimaryService("blood_pressure");
      const characteristic = await service.getCharacteristic("blood_pressure_measurement");

      await characteristic.startNotifications();
      
      device.addEventListener("gattserverdisconnected", () => controller.abort());

      characteristic.addEventListener("characteristicvaluechanged", onBloodPressure);

      try { await characteristic.readValue(); } catch {}

      async function onBloodPressure(event: Event) {
        const value = (event.target as unknown as BluetoothRemoteGATTCharacteristic).value!;
        const parsed = parseBloodPressureMeasurement(value);
        
        // Evitar duplicados
        if (dedupeBP(parsed)) return;
        
        const payload: Saved = {
          sistolica: parsed.systolic ?? null,
          diastolica: parsed.diastolic ?? null,
          pulso_bpm: parsed.pulse ?? null,
          spo2: null,
          peso_kg: null,
          source: "ble",
        };
        await saveMeasurement(payload);
      }

      return () => {
        try { 
          characteristic.removeEventListener("characteristicvaluechanged", onBloodPressure);
          server.disconnect();
        } catch {}
      };
    } catch (error) {
      console.error("Error BLE:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }

  // ---------- 0x180D Heart Rate Service ----------
  async function connectHeartRate() {
    ensureBLE();
    setIsConnecting(true);
    
    const controller = new AbortController();
    
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ["heart_rate"] }], // 0x180D
      });
      
      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService("heart_rate");
      const hrChar = await service.getCharacteristic("heart_rate_measurement");
      
      await hrChar.startNotifications();
      
      device.addEventListener("gattserverdisconnected", () => controller.abort());
      hrChar.addEventListener("characteristicvaluechanged", onHR);

      try { await hrChar.readValue(); } catch {}

      async function onHR(event: Event) {
        const dv = (event.target as unknown as BluetoothRemoteGATTCharacteristic).value!;
        const bpm = parseHeartRateMeasurement(dv);
        
        // Rate limiting para frecuencia cardíaca
        if (Date.now() - lastHRSave > HR_SAVE_MS) {
          lastHRSave = Date.now();
          const payload: Saved = {
            sistolica: null,
            diastolica: null,
            pulso_bpm: bpm ?? null,
            spo2: null,
            peso_kg: null,
            source: "ble",
          };
          await saveMeasurement(payload);
        }
      }

      return () => {
        try {
          hrChar.removeEventListener("characteristicvaluechanged", onHR);
          server.disconnect();
        } catch {}
      };
    } catch (error) {
      console.error("Error BLE:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }

  // ---------- Guardado en Supabase ----------
  async function saveMeasurement(data: Saved) {
    const userId = await getUserId();
    const row = {
      usuario_id: userId,
      ts: new Date().toISOString(),
      source: data.source,
      sistolica: data.sistolica,
      diastolica: data.diastolica,
      pulso_bpm: data.pulso_bpm,
      spo2: data.spo2,
      peso_kg: data.peso_kg,
    };
    const { error } = await supabase.from("mediciones").insert(row);
    if (error) console.error("Error guardando BLE:", error.message);
  }

  return { 
    connectBloodPressure, 
    connectHeartRate,
    isConnecting,
    supportsBLE: !!navigator.bluetooth && !/iPad|iPhone|iPod/.test(navigator.userAgent)
  };
}

// ---------------- Parsers BLE ----------------

// Blood Pressure Measurement (0x2A35):
// Flags (8 bits):
//  bit0: units (0=mmHg, 1=kPa)
//  bit1: timeStamp present
//  bit2: pulse rate present
//  bit3: userId present
//  bit4: measurement status present
// Valores principales son SFLOAT16 IEEE-11073 (little-endian)
function parseBloodPressureMeasurement(dv: DataView): {
  systolic?: number;
  diastolic?: number;
  map?: number;
  pulse?: number;
} {
  let offset = 0;
  const flags = dv.getUint8(offset++);

  const unitsKPa = (flags & 0x01) === 0x01; // 0=mmHg, 1=kPa
  const systolic = readSFloat(dv, offset); offset += 2;
  const diastolic = readSFloat(dv, offset); offset += 2;
  const map = readSFloat(dv, offset); offset += 2;

  // convertir a mmHg si venía en kPa
  const kPaToMmHg = (x: number | undefined) =>
    x == null ? undefined : x * 7.50062;

  let s = systolic, d = diastolic, m = map;
  if (unitsKPa) {
    s = kPaToMmHg(s);
    d = kPaToMmHg(d);
    m = kPaToMmHg(m);
  }

  // saltar timestamp si existe
  if (flags & 0x02) offset += 7; // year(2),mon,day,hour,min,sec

  let pulse: number | undefined = undefined;
  if (flags & 0x04) {
    const p = readSFloat(dv, offset);
    offset += 2;
    pulse = p ? Math.round(p) : undefined;
  }

  return {
    systolic: s ? Math.round(s) : undefined,
    diastolic: d ? Math.round(d) : undefined,
    map: m,
    pulse,
  };
}

// Heart Rate Measurement (0x2A37)
// Flag bit0: 0=uint8, 1=uint16
function parseHeartRateMeasurement(dv: DataView): number | undefined {
  let offset = 0;
  const flags = dv.getUint8(offset++);
  const sixteenBit = (flags & 0x01) === 0x01;
  const bpm = sixteenBit ? dv.getUint16(offset, true) : dv.getUint8(offset);
  return bpm || undefined;
}

// IEEE-11073 16-bit SFLOAT (exponente de 4 bits, mantisa 12 bits, little-endian)
function readSFloat(dv: DataView, offset: number): number | undefined {
  const raw = dv.getUint16(offset, true);
  if (raw === 0x07ff || raw === 0x0800) return undefined; // NaN/reserved
  const mantissa = signed12(raw & 0x0fff);
  const exponent = signed4(raw >> 12);
  return mantissa * Math.pow(10, exponent);
}
function signed12(n: number) { return (n & 0x0800) ? n - 0x1000 : n; }
function signed4(n: number) { return (n & 0x0008) ? n - 0x0010 : n; }