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
export async function connect(): Promise<{ name?: string } | void> {
  await BleClient.initialize();
  device = await BleClient.requestDevice({
    services: [to128(HR_SERVICE)],
    optionalServices: [to128(HR_SERVICE)],
  });
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
  if (hrUnsub) { hrUnsub(); hrUnsub = null; }
}
