import React, { useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { BleClient } from "@capacitor-community/bluetooth-le";

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

  const connectBle = async () => {
    if (!isNative) {
      setStatus("BLE solo disponible en la app nativa.");
      return;
    }
    try {
      setIsConnecting(true);
      await BleClient.initialize();

      // Permisos (Android 12+). Opcionales según versión del plugin/SO
      try { await (BleClient as any).requestLEScanPermissions?.(); } catch {}
      try { await (BleClient as any).requestLEPermissions?.(); } catch {}

      // Ajusta UUIDs si usas otro servicio
      const dev = await BleClient.requestDevice({ services: ["heart_rate"] });
      await BleClient.connect(dev.deviceId);

      setStatus(`Conectado: ${dev.name ?? dev.deviceId}`);
    } catch (e: any) {
      setStatus(`Error BLE: ${e?.message ?? String(e)}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Funciones de compatibilidad (por si tu pantalla las llama)
  const conectarBleNativo = connectBle;
  const connectBloodPressure = connectBle;
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
