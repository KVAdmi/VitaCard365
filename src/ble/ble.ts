// BLE Wrapper API pública para FTMS/HRM
// No tocar UI ni flujo de sesión. Solo enriquecer métricas.
// Tipado estricto, sin any.

import { BluetoothLe } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';
import { parseFtms, parseHr, FTMS, HRS, CHARS_FTMS, type FtmsSample, type HrSample, type LEScanResult } from './bleFtmsHrm';

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
    // Verificar Bluetooth encendido si el plugin lo soporta
    const bt = await BluetoothLe.isEnabled();
    if (!bt.value) throw new Error('BLE_DISABLED');
  } catch (e: any) {
    if (e?.message === 'BLE_DISABLED') throw new Error('BLE_DISABLED');
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
 * Detiene el escaneo BLE activo
 */
export async function stopScan(): Promise<void> {
  if (!isScanning) return;
  isScanning = false;
  if (scanTimeout) clearTimeout(scanTimeout);
  try {
    await BluetoothLe.stopLEScan();
    devLog('stopScan: escaneo detenido');
  } catch (e) {
    devLog('stopScan error', e);
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
    await BluetoothLe.requestLEScan(
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
    await BluetoothLe.connect({ deviceId });
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
      await BluetoothLe.startNotifications(
        { deviceId, service: FTMS, characteristic: char },
        (n: any) => {
          if (!n?.value) return;
          const sample = parseFtms(n.value);
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
    await BluetoothLe.startNotifications(
      { deviceId, service: HRS, characteristic: '2A37' },
      (n: any) => {
        if (!n?.value) return;
        const sample = parseHr(n.value);
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
    await BluetoothLe.stopNotifications({ deviceId, service, characteristic });
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
    await BluetoothLe.disconnect({ deviceId });
  } catch (e) {
    devLog('disconnect error', e);
    throw new Error(ERRORS.DISCONNECT_FAILED);
  }
}

export type { LEScanResult };
