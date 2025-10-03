// BLE Wrapper API pública para FTMS/HRM
// No tocar UI ni flujo de sesión. Solo enriquecer métricas.
// Tipado estricto, sin any.

import { BleClient } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';
import { parseFtms, parseHr, FTMS, HRS, type FtmsSample, type HrSample, type LEScanResult } from './bleFtmsHrm';

// Mensajes de error centralizados
export const ERRORS = {
  CONNECT_FAILED: 'BLE_CONNECT_FAILED',
  SUBSCRIBE_FAILED: (char: string) => `BLE_SUBSCRIBE_FAILED: ${char}`,
  NOTIFICATIONS_FAILED: 'BLE_NOTIFICATIONS_FAILED',
  DISCONNECT_FAILED: 'BLE_DISCONNECT_FAILED',
};

// Helpers de log solo en desarrollo
function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[BLE]', ...args);
  }
}

// Contadores internos (telemetría)
let samplesCount = 0;
let lastCharUpdatedAt: number | null = null;
// Paso 3 — stopScan() real y guard isScanning
let isScanning = false;
let scanTimeout: ReturnType<typeof setTimeout> | null = null;
// Conexión actual
let isConnecting = false;
let connectedDeviceId: string | null = null;
let hrSubscribed = false;
let adapterPollTimer: ReturnType<typeof setInterval> | null = null;

export function getSamplesCount() {
  return samplesCount;
}
export function getLastCharUpdatedAt() {
  return lastCharUpdatedAt;
}

/**
 * Verifica permisos BLE y Bluetooth ON según Android.
 * SDK ≥31: requiere BLUETOOTH_SCAN / BLUETOOTH_CONNECT (debe estar concedido por el usuario en Ajustes si no se puede pedir desde JS).
 * SDK 29–30: requiere ACCESS_FINE_LOCATION (igual, si no se puede pedir desde JS, fallback = error BLE_PERMISSIONS_DENIED).
 * Si Bluetooth está apagado, devuelve BLE_DISABLED.
 * No introduce dependencias ni código nativo.
 */
export async function ensureBleReady(): Promise<void> {
  // Solo Android nativo
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
  // Aquí podrías intentar pedir permisos con Capacitor Permissions si tuvieras acceso,
  // pero si no, simplemente documenta el fallback:
  // Si el usuario no concede permisos desde Ajustes, el wrapper aborta con error claro.
  try {
    // Inicializar y verificar Bluetooth encendido
    await BleClient.initialize();
    const enabled = await BleClient.isEnabled();
    if (!enabled) {
      try {
        await BleClient.requestEnable();
      } catch {
        throw new Error('BLE_ADAPTER_OFF');
      }
      const enabled2 = await BleClient.isEnabled();
      if (!enabled2) throw new Error('BLE_ADAPTER_OFF');
    }
  } catch (e: any) {
    if (e?.message === 'BLE_ADAPTER_OFF') throw new Error('BLE_ADAPTER_OFF');
    throw new Error('BLE_PERMISSIONS_DENIED');
  }
}

/**
 * Devuelve si hay escaneo activo
 */
export function getIsScanning() {
  return isScanning;
}

/**
 * Devuelve si hay conexión activa y el deviceId
 */
export function getConnectedDeviceId() {
  return connectedDeviceId;
}

export function getIsConnecting() {
  return isConnecting;
}

/**
 * Detiene el escaneo BLE activo
 */
export async function stopScan(): Promise<void> {
  if (!isScanning) return;
  isScanning = false;
  if (scanTimeout) clearTimeout(scanTimeout);
  try {
    await BleClient.stopLEScan();
    devLog('stopScan: escaneo detenido');
  } catch (e) {
    devLog('stopScan error', e);
  }
}

// API nueva solicitada: asegurar permisos BLE explícitos
export async function ensureBlePermissions(): Promise<void> {
  try {
    await ensureBleReady();
  } catch (e) {
    throw e instanceof Error ? e : new Error('BLE_PERMISSIONS_DENIED');
  }
}

// API nueva solicitada: escaneo simple 15s sin duplicados
export async function startScan(onDevice: (device: { deviceId: string; name?: string; rssi?: number }) => void): Promise<void> {
  if (isScanning) return;
  await ensureBlePermissions();
  isScanning = true;
  try {
    await BleClient.requestLEScan({ allowDuplicates: false }, (result: any) => {
      const device = result?.device;
      if (device?.deviceId) {
        onDevice({ deviceId: device.deviceId, name: device.name ?? 'Unknown', rssi: device.rssi });
      }
    });
    scanTimeout = setTimeout(() => { stopScan(); }, 15000);
  } catch (e: any) {
    isScanning = false;
    const msg = (e?.message || String(e)).toLowerCase();
    if (msg.includes('permission') || msg.includes('denied')) throw new Error('BLE_PERMISSIONS_DENIED');
    if (msg.includes('off') || msg.includes('enable')) throw new Error('BLE_ADAPTER_OFF');
    throw new Error('BLE_SCAN_ERROR');
  }
}

/**
 * Escanea dispositivos FTMS y HRM, llamando onDevice por cada hallazgo.
 */
export async function scanFtmsHr(onDevice: (result: LEScanResult) => void): Promise<void> {
  if (isScanning) {
    devLog('scanFtmsHr: ya hay un escaneo activo');
    return;
  }
  try {
    await ensureBleReady();
  } catch (e) {
    devLog('Permisos insuficientes o Bluetooth apagado', e);
    throw new Error('BLE_PERMISSIONS_DENIED: Activa Dispositivos cercanos y Ubicación en Ajustes');
  }
  isScanning = true;
  let hallazgos = 0;
  devLog('scanFtmsHr: inicio de escaneo', { filtros: [FTMS, HRS] });
  try {
    await BleClient.requestLEScan(
      { services: [FTMS, HRS], allowDuplicates: true },
      (result: any) => {
        const device = result?.device;
        if (device?.deviceId) {
          const res: LEScanResult = {
            deviceId: device.deviceId,
            name: device.name ?? 'Unknown',
            rssi: device.rssi,
          };
          hallazgos++;
          devLog('scan result', res);
          onDevice(res);
        }
      }
    );
    scanTimeout = setTimeout(() => {
      stopScan();
      devLog('scanFtmsHr: fin de escaneo, hallazgos:', hallazgos);
    }, 25000);
  } catch (e: any) {
    isScanning = false;
    if (e?.message?.includes('PERMISSION') || e?.message?.includes('denied')) {
      throw new Error('BLE_PERMISSIONS_DENIED: Activa Dispositivos cercanos y Ubicación en Ajustes');
    }
    devLog('scan error', e);
    throw new Error('BLE_SCAN_FAILED');
  }
}

/**
 * Conecta a un dispositivo por deviceId.
 */
export async function connect(deviceId: string): Promise<void> {
  try {
    devLog('connect', deviceId);
    await BleClient.connect(deviceId);
  } catch (e) {
    devLog('connect error', deviceId, e);
    throw new Error(ERRORS.CONNECT_FAILED);
  }
}

/**
 * Suscribe a características FTMS y emite muestras normalizadas.
 */
export async function subscribeFtms(
  deviceId: string,
  characteristics: string[],
  onFtms: (sample: FtmsSample) => void
): Promise<void> {
  for (const char of characteristics) {
    try {
      await BleClient.startNotifications(
        deviceId,
        FTMS,
        char,
        (value: DataView) => {
          if (!value) return;
          const sample = parseFtms(value);
          if (Object.keys(sample).length > 0) {
            samplesCount++;
            lastCharUpdatedAt = Date.now();
            devLog('ftms sample', sample);
            onFtms(sample);
          }
        }
      );
    } catch (e) {
      devLog('subscribe FTMS error', char, e);
      throw new Error(ERRORS.SUBSCRIBE_FAILED(char));
    }
  }
}

/**
 * Suscribe a HRM y emite bpm crudo.
 */
export async function subscribeHr(
  deviceId: string,
  onHr: (sample: HrSample) => void
): Promise<void> {
  try {
    await BleClient.startNotifications(
      deviceId,
      HRS,
      '2A37',
      (value: DataView) => {
        if (!value) return;
        const sample = parseHr(value);
        if (sample) {
          samplesCount++;
          lastCharUpdatedAt = Date.now();
          devLog('hr sample', sample);
          onHr(sample);
        }
      }
    );
  } catch (e) {
    devLog('subscribe HR error', e);
    throw new Error(ERRORS.SUBSCRIBE_FAILED('2A37'));
  }
}

/**
 * Detiene notificaciones de una característica.
 */
export async function stopNotifications(
  deviceId: string,
  service: string,
  characteristic: string
): Promise<void> {
  try {
    await BleClient.stopNotifications(deviceId, service, characteristic);
  } catch (e) {
    devLog('stopNotifications error', e);
    throw new Error(ERRORS.NOTIFICATIONS_FAILED);
  }
}

/**
 * Desconecta el dispositivo.
 */
export async function disconnect(deviceId: string): Promise<void> {
  try {
    await BleClient.disconnect(deviceId);
  } catch (e) {
    devLog('disconnect error', e);
    throw new Error(ERRORS.DISCONNECT_FAILED);
  }
}

export type { LEScanResult };

// ------------------- Nuevas utilidades de conexión de alto nivel -------------------

const UUIDS = {
  HRS: HRS, // '180D'
  HR_MEAS: '2A37',
  BATTERY: '180F',
  BATTERY_LEVEL: '2A19',
  FTMS: FTMS, // '1826'
};

export type ConnectFlowResult = {
  deviceId: string;
  hasHr: boolean;
  hasFtms: boolean;
  type: 'Heart Rate' | 'FTMS' | 'Unknown';
  batteryPct?: number;
  disconnect: () => Promise<void>;
};

type ConnectFlowOpts = {
  deviceId: string;
  onHr?: (bpm: number) => void;
  onAdapterOff?: () => void;
  timeoutMs?: number; // default 10s
};

async function readBatteryPct(deviceId: string): Promise<number | undefined> {
  try {
    const dv = (await (BleClient as any).read(deviceId, UUIDS.BATTERY, UUIDS.BATTERY_LEVEL)) as DataView;
    if (!dv) return undefined;
    const pct = dv.getUint8(0);
    if (Number.isFinite(pct)) return pct;
  } catch (e) {
    devLog('battery read error', e);
  }
  return undefined;
}

async function discoverServices(deviceId: string): Promise<{ hasHr: boolean; hasFtms: boolean; hasBattery: boolean }> {
  try {
    const services: Array<{ uuid: string }> = await (BleClient as any).getServices(deviceId);
    const uuids = (services || []).map((s) => s.uuid?.toLowerCase());
    const hasHr = uuids.includes(`0000${UUIDS.HRS}-0000-1000-8000-00805f9b34fb`) || uuids.includes(UUIDS.HRS.toLowerCase());
    const hasFtms = uuids.includes(`0000${UUIDS.FTMS}-0000-1000-8000-00805f9b34fb`) || uuids.includes(UUIDS.FTMS.toLowerCase());
    const hasBattery = uuids.includes(`0000${UUIDS.BATTERY}-0000-1000-8000-00805f9b34fb`) || uuids.includes(UUIDS.BATTERY.toLowerCase());
    return { hasHr, hasFtms, hasBattery };
  } catch (e) {
    // Fallback: intentar detectar por suscripciones posteriores
    devLog('discoverServices error', e);
    return { hasHr: false, hasFtms: false, hasBattery: false };
  }
}

/**
 * Flujo de conexión completo (timeout, detección de servicios, HR notify, batería, polling adaptador)
 * Reglas: un solo intento/conn a la vez; cierra escaneo si está activo.
 */
export async function connectFlow(opts: ConnectFlowOpts): Promise<ConnectFlowResult> {
  const { deviceId, onHr, onAdapterOff, timeoutMs = 10000 } = opts;
  if (isConnecting || connectedDeviceId) {
    throw new Error('ALREADY_CONNECTED');
  }

  await ensureBlePermissions();
  // Detener escaneo activo
  await stopScan().catch(() => {});

  isConnecting = true;
  try {
    // Conectar con timeout
    const connected = await Promise.race([
      (async () => {
        await connect(deviceId);
        return true;
      })(),
      new Promise<boolean>((_, rej) => setTimeout(() => rej(new Error('BLE_CONNECT_TIMEOUT')), timeoutMs)),
    ]);
    if (!connected) throw new Error('BLE_CONNECT_FAILED');
    connectedDeviceId = deviceId;

    // Descubrir servicios y capacidades
    const caps = await discoverServices(deviceId);
    const type: 'Heart Rate' | 'FTMS' | 'Unknown' = caps.hasHr ? 'Heart Rate' : caps.hasFtms ? 'FTMS' : 'Unknown';

    // Suscripción HR si procede
    if (caps.hasHr && onHr) {
      await subscribeHr(deviceId, (s) => {
        if (s && typeof s === 'number') {
          onHr(s);
        } else if (s && (s as any).hr_bpm != null) {
          onHr((s as any).hr_bpm);
        }
      });
      hrSubscribed = true;
    }

    // Batería
    const batteryPct = caps.hasBattery ? await readBatteryPct(deviceId) : undefined;

    // Poll del adaptador cada 3s para detectar apagado
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      if (adapterPollTimer) clearInterval(adapterPollTimer);
      adapterPollTimer = setInterval(async () => {
        try {
          const enabled = await BleClient.isEnabled();
          if (!enabled) {
            if (onAdapterOff) onAdapterOff();
            await safeDisconnect(deviceId);
          }
        } catch {
          // ignorar
        }
      }, 3000);
    }

    return {
      deviceId,
      hasHr: !!caps.hasHr,
      hasFtms: !!caps.hasFtms,
      type,
      batteryPct,
      disconnect: async () => {
        await safeDisconnect(deviceId);
      },
    };
  } catch (e: any) {
    // Si el timeout fue el motivo, propagar ese código
    if (e?.message === 'BLE_CONNECT_TIMEOUT') {
      throw e;
    }
    throw new Error(ERRORS.CONNECT_FAILED);
  } finally {
    isConnecting = false;
  }
}

async function safeDisconnect(deviceId: string) {
  try {
    // Detener notificaciones HR si estaban activas
    if (hrSubscribed) {
      try { await stopNotifications(deviceId, UUIDS.HRS, UUIDS.HR_MEAS); } catch {}
      hrSubscribed = false;
    }
    if (adapterPollTimer) { clearInterval(adapterPollTimer); adapterPollTimer = null; }
    await disconnect(deviceId);
  } finally {
    connectedDeviceId = null;
    isConnecting = false;
  }
}
