import React, { useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";

// [BLE] Using bridge only
import { connect, disconnect, startHeartRate, stopHeartRate } from '../lib/bleNative';
import { Device } from '@capacitor/device';

/**
 * Hook compatible con MeasureVitals.jsx
 * Devuelve acciones y estado mínimo para operar BLE en nativo.
 */
export function useBLEVitals() {
  const [status, setStatus] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);

  // Cachea si es plataforma nativa
  const isNative = useMemo(() => Capacitor.isNativePlatform(), []);
  // Solo para mostrar banner en web si no hay Web Bluetooth. Sin declarar tipos globales.
  const supportsBLE = !!((navigator as any)?.bluetooth);

  async function ensureBlePermissions() {
    const info = await Device.getInfo();
    const isAndroid = info.platform === 'android';
    if (!isAndroid) return;

    // @ts-ignore cordova global
    const perms = window.cordova?.plugins?.permissions;
    if (!perms) return; // En iOS o web no aplica

    // Android 12+ pide BLUETOOTH_SCAN / CONNECT; en <=11, pide BLUETOOTH, BLUETOOTH_ADMIN y FINE_LOCATION
    const api = Number(info.osVersion?.split('.')?.[0] || 0);
    const req: string[] = api >= 12
      ? [perms.BLUETOOTH_SCAN, perms.BLUETOOTH_CONNECT]
      : [perms.BLUETOOTH, perms.BLUETOOTH_ADMIN, perms.ACCESS_FINE_LOCATION];

    await new Promise<void>((resolve, reject) => {
      perms.requestPermissions(req, (st: any) => {
        const granted = Object.values(st?.hasPermission ?? {}).every(Boolean) || st?.hasPermission === true;
        granted ? resolve() : reject(new Error('Faltan permisos de Bluetooth. Ve a Ajustes > Apps > Permisos y activa Bluetooth y Ubicación.'));
      }, () => reject(new Error('Faltan permisos de Bluetooth. Ve a Ajustes > Apps > Permisos y activa Bluetooth y Ubicación.')));
    });
  }

  const connectBle = async () => {
    if (!isNative) {
      setStatus("BLE solo disponible en la app nativa.");
      return;
    }
    try {
      setIsConnecting(true);
      await ensureBlePermissions();
      console.log('[BLE] Using bridge only');
      await connect();
      await startHeartRate((bpm) => {
        setStatus(`BPM: ${bpm}`);
      });
      setStatus('Conectado y recibiendo HR...');
    } catch (e: any) {
      setStatus(`Error BLE: ${e?.message ?? String(e)}`);
      if (e?.message?.includes('permisos')) {
        alert('Debes otorgar permisos de Bluetooth y Ubicación para usar sensores BLE. Ve a Ajustes > Apps > Permisos.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Funciones de compatibilidad (por si tu pantalla las llama)
  const conectarBleNativo = connectBle;
  const connectBloodPressure = connectBle; // Si BP se migra al bridge, actualizar aquí
  const connectHeartRate = connectBle;

  return {
    // acciones
    connectBle,
    conectarBleNativo,
    connectBloodPressure,
    connectHeartRate,
    // estado
    isConnecting,
    status,
    // info del entorno
    isNative,
    supportsBLE,
  };
}

/**
 * Componente simple para probar conexión BLE desde UI.
 * Default export (sigue existiendo para quien lo use como componente).
 */
export default function BLEConnect() {
  const {
    connectBle,
    isConnecting,
    status,
    isNative,
    supportsBLE,
  } = useBLEVitals();

  return (
    <div>
      {isNative ? (
        <button onClick={connectBle} disabled={isConnecting}>
          {isConnecting ? "Conectando..." : "Conectar BLE"}
        </button>
      ) : !supportsBLE ? (
        <div className="alert">
          Bluetooth no disponible en este navegador. Usa la app nativa.
        </div>
      ) : (
        <button onClick={connectBle}>Conectar (Web)</button>
      )}

      <div style={{ marginTop: 8 }}>{status}</div>
    </div>
  );
}
