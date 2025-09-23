// [BLE] Using bridge only
import { connect, disconnect, startHeartRate, stopHeartRate } from '../lib/bleNative';
import { supabase } from '@/lib/supabaseClient';


let lastBPKey = "";

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

// dedupeBP y parsers eliminados: solo HR usa el bridge

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

// El bridge BLE nativo ya inicializa internamente si es necesario
export function initializeBLE() {
  console.log('[BLE] Using bridge only');
}

// Si BP se usa, migrar a bridge en el futuro. Por ahora, solo HR usa bridge.

// [BLE] Using bridge only
export async function connectHeartRate(onBpm: (bpm: number) => void) {
  console.log('[BLE] Using bridge only');
  await connect();
  await startHeartRate(onBpm);
  // Para desconectar/limpiar: llamar disconnect() y stopHeartRate() desde el consumidor
}

// Utilidad para comprobar compatibilidad (migrar a bridge si se requiere)