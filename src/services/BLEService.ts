import { BleClient, BleDevice, numberToUUID } from '@capacitor-community/bluetooth-le';
import { supabase } from '@/lib/supabaseClient';
import { parseBloodPressureMeasurement, parseHeartRateMeasurement } from './BLEParsers';

let lastBPKey = "";
let lastHRSave = 0;
const HR_SAVE_MS = 5000;

interface BLEMeasurement {
  sistolica?: number | null;
  diastolica?: number | null;
  pulso_bpm?: number | null;
  spo2?: number | null;
  peso_kg?: number | null;
  source: "ble";
}

async function getUserId() {
  const { data } = await supabase.auth.getUser();
  const uid = data?.user?.id;
  if (!uid) throw new Error("No hay sesión");
  return uid;
}

// Evitar duplicados en mediciones de presión arterial
function dedupeBP(data: { systolic?: number; diastolic?: number; pulse?: number }) {
  const key = [data.systolic ?? "x", data.diastolic ?? "x", data.pulse ?? "x"].join("-");
  if (key === lastBPKey) return true;
  lastBPKey = key;
  return false;
}

async function saveMeasurement(data: BLEMeasurement) {
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

export async function initializeBLE() {
  try {
    await BleClient.initialize();
  } catch (error) {
    throw new Error("No se pudo inicializar Bluetooth");
  }
}

export async function connectBloodPressure() {
  try {
    await BleClient.initialize();
    
    const device = await BleClient.requestDevice({
      services: ['1810'], // Blood Pressure Service
      optionalServices: ['180F'] // Battery Service
    });

    await BleClient.connect(device.deviceId);
    
    // Suscribirse a notificaciones de presión arterial
    await BleClient.startNotifications(
      device.deviceId,
      '1810',
      '2A35',
      (value) => {
        const parsed = parseBloodPressureMeasurement(value);
        if (!dedupeBP(parsed)) {
          const measurement: BLEMeasurement = {
            sistolica: parsed.systolic ?? null,
            diastolica: parsed.diastolic ?? null,
            pulso_bpm: parsed.pulse ?? null,
            source: 'ble'
          };
          saveMeasurement(measurement);
        }
      }
    );

    return device;
  } catch (error) {
    console.error('Error conectando tensiómetro:', error);
    throw error;
  }
}

export async function connectHeartRate() {
  try {
    await BleClient.initialize();
    
    const device = await BleClient.requestDevice({
      services: ['180D'], // Heart Rate Service
    });

    await BleClient.connect(device.deviceId);
    
    await BleClient.startNotifications(
      device.deviceId,
      '180D',
      '2A37',
      (value) => {
        const bpm = parseHeartRateMeasurement(value);
        
        // Rate limiting para frecuencia cardíaca
        if (Date.now() - lastHRSave > HR_SAVE_MS) {
          lastHRSave = Date.now();
          const measurement: BLEMeasurement = {
            sistolica: null,
            diastolica: null,
            pulso_bpm: bpm ?? null,
            source: 'ble'
          };
          saveMeasurement(measurement);
        }
      }
    );

    return device;
  } catch (error) {
    console.error('Error conectando monitor cardíaco:', error);
    throw error;
  }
}

// Utilidad para comprobar compatibilidad
export async function checkDeviceCompatibility(device: BleDevice) {
  const services = await BleClient.getServices(device.deviceId);
  const compatibleServices = ['1810', '180D', '181D']; // BP, HR, Weight
  
  return services.some(service => 
    compatibleServices.includes(service.uuid.substring(4, 8))
  );
}