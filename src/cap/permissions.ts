import { Capacitor } from '@capacitor/core';
import { BluetoothLe, ScanMode } from '@capacitor-community/bluetooth-le';

export async function ensureBLE() {
  if (Capacitor.getPlatform() !== 'android') return true;
  try {
    await BluetoothLe.requestLEScan({ allowDuplicates: false, scanMode: ScanMode.SCAN_MODE_BALANCED });
    await BluetoothLe.stopLEScan();
    return true;
  } catch {
    return false;
  }
}


export async function ensureMic() {
  if (Capacitor.getPlatform() === 'web') return true;
  try {
    // fallback universal: intentar acceder a getUserMedia
    if (navigator.mediaDevices?.getUserMedia) {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
