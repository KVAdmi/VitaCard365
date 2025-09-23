// @/lib/bleNative.ts
// Bridge nativo BLE para APK usando @capacitor-community/bluetooth-le
import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';

let device: BleDevice | null = null;
let hrUnsub: (() => void) | null = null;

const HR_SERVICE = '180D';
const HR_MEASUREMENT = '2A37';

// Conecta a un dispositivo BLE compatible con HR
export async function connect(): Promise<{ name?: string } | void> {
  await BleClient.initialize();
  device = await BleClient.requestDevice({
    services: [HR_SERVICE],
    optionalServices: [HR_SERVICE],
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
  hrUnsub = await BleClient.startNotifications(
    device.deviceId,
    HR_SERVICE,
    HR_MEASUREMENT,
    (value) => {
      const v = value instanceof DataView ? value : new DataView(value.buffer ?? value);
      const flags = v.getUint8(0);
      const hr = (flags & 0x01) ? v.getUint16(1, true) : v.getUint8(1);
      onBpm(hr);
    }
  );
}

export async function stopHeartRate(): Promise<void> {
  if (hrUnsub) { hrUnsub(); hrUnsub = null; }
}
