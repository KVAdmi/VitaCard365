// @/lib/bleNative.ts
// Bridge nativo BLE para APK usando @capacitor-community/bluetooth-le

import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';

let device: BleDevice | null = null;
let hrUnsub: (() => void) | null = null;

// Normalizador UUIDs BLE (a prueba de balas)
const to128 = (u: string) => {
  const hex = u.replace(/^0x/i, '').toLowerCase();
  if (hex.length === 4) return `0000${hex}-0000-1000-8000-00805f9b34fb`;
  if (hex.length === 8) return `${hex}-0000-1000-8000-00805f9b34fb`;
  return u.toLowerCase();
};

const HR_SERVICE_RAW = '0000180d-0000-1000-8000-00805f9b34fb';
const HR_MEASUREMENT_RAW = '00002a37-0000-1000-8000-00805f9b34fb';
const HR_SERVICE = to128(HR_SERVICE_RAW);
const HR_MEASUREMENT = to128(HR_MEASUREMENT_RAW);

// Conecta a un dispositivo BLE compatible con HR
// Estrategia: inicializa BLE, asegura Bluetooth encendido,
// escanea 8s filtrando por servicio HRS (0x180D) y conecta al primero encontrado.
export async function connect(): Promise<{ name?: string } | void> {
  await BleClient.initialize();
  // Asegurar Bluetooth encendido (Android puede requerir toggle)
  const enabled = await BleClient.isEnabled().catch(() => false);
  if (!enabled) {
    try { await BleClient.requestEnable(); } catch {
      throw new Error('BLE_ADAPTER_OFF');
    }
  }

  // Escaneo filtrado por HRS (anuncio 0x180D)
  let found: BleDevice | null = null;
  try {
    await BleClient.requestLEScan({ services: [HR_SERVICE], allowDuplicates: false }, (res: any) => {
      if (found) return;
      const dev: BleDevice | undefined = res?.device;
      if (dev?.deviceId) {
        found = dev;
        // detener escaneo en cuanto encontremos uno
        BleClient.stopLEScan().catch(() => {});
      }
    });
  } catch (e: any) {
    const msg = (e?.message || '').toLowerCase();
    if (msg.includes('permission') || msg.includes('denied')) throw new Error('BLE_PERMISSIONS_DENIED');
    throw e;
  }

  // Esperar hasta 8s por un dispositivo
  const startedAt = Date.now();
  while (!found && Date.now() - startedAt < 8000) {
    await new Promise(r => setTimeout(r, 200));
  }
  try { await BleClient.stopLEScan(); } catch {}
  if (!found) {
    throw new Error('No se encontró un monitor de pulso cercano');
  }

  device = found;
  await BleClient.connect(device.deviceId);
  return { name: device.name };
}

export async function disconnect(): Promise<void> {
  if (device) {
    try { await BleClient.disconnect(device.deviceId); } catch {}
    device = null;
  }
  if (hrUnsub) { hrUnsub(); hrUnsub = null; }
}

// Suscribe a notificaciones de HR
export async function startHeartRate(onBpm: (bpm: number) => void): Promise<void> {
  if (!device) throw new Error('No device connected');
  console.log('[BLE] HR UUIDs (normalized):', to128(HR_SERVICE), to128(HR_MEASUREMENT));
  await BleClient.startNotifications(
    device.deviceId,
    to128(HR_SERVICE),
    to128(HR_MEASUREMENT),
    (value: DataView) => {
      const v = value instanceof DataView ? value : new DataView((value as any).buffer ?? value);
      const flags = v.getUint8(0);
      const hr = (flags & 0x01) ? v.getUint16(1, true) : v.getUint8(1);
      onBpm(hr);
    }
  );
}

export async function stopHeartRate(): Promise<void> {
  if (hrUnsub) { try { hrUnsub(); } catch {} hrUnsub = null; }
}
