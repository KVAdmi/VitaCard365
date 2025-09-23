import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import KeepAliveAccordion from '@/components/ui/KeepAliveAccordion';
import * as BLE from '../../lib/bleNative';

// [BLE] Using bridge only (rama nativa)
const FITNESS_MACHINE = 0x1826;    // Fitness Machine (treadmill, bike, etc.)
const DEVICE_INFO = 0x180a;

// --- Helpers ---
function isWebBluetoothSupported() {
  // Web Bluetooth NO existe en iOS Safari; en Android/Chrome sí.
  const hasApi = typeof navigator !== 'undefined' && !!navigator.bluetooth && !!navigator.bluetooth.requestDevice;
  if (!hasApi) return false;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  if (isIOS) return false;
  return true;
}

function parseHeartRate(value) {
  const v = value instanceof DataView ? value : new DataView(value.buffer ?? value);
  const flags = v.getUint8(0);
  const hr16 = !!(flags & 0x01);
  return hr16 ? v.getUint16(1, true) : v.getUint8(1);
}

// --- Componente ---
export default function GymBlePanel({ onHr }) {
  const isNative = Capacitor.isNativePlatform();
  const webBleOk = useMemo(() => isWebBluetoothSupported(), []);

  // Estado UI
  const [status, setStatus] = useState('Listo');
  const [error, setError] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [connected, setConnected] = useState(false);
  const [hr, setHr] = useState(null);
  const [samples, setSamples] = useState(0);

  // Refs Web Bluetooth
  const deviceRef = useRef(null);
  const serverRef = useRef(null);
  const hrCharRef = useRef(null);

  // Import estático: BLE bridge siempre disponible, solo se usa en nativo

  // Limpieza al desmontar (Web y nativo)
  useEffect(() => {
    return () => {
      try { hrCharRef.current?.removeEventListener('characteristicvaluechanged', onHrValue); } catch {}
      try { deviceRef.current?.gatt?.disconnect(); } catch {}
      // Limpieza nativa si aplica
      if (isNative) {
        try { BLE.stopHeartRate(); } catch {}
        try { BLE.disconnect(); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Handlers Web Bluetooth ---
  const onHrValue = useCallback((e) => {
    try {
      const val = e.target.value;
      const bpm = parseHeartRate(val);
      setHr(bpm);
      setSamples((n) => n + 1);
      if (typeof onHr === 'function') onHr(bpm);
    } catch {
      // silencioso
    }
  }, [onHr]);

  const connectHeartRateIfPresent = useCallback(async (server) => {
    try {
      // HR_SERVICE y HR_MEASUREMENT solo en web
      const HR_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
      const HR_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';
      const svc = await server.getPrimaryService(HR_SERVICE);
      const ch = await svc.getCharacteristic(HR_MEASUREMENT);
      hrCharRef.current = ch;
      await ch.startNotifications();
      ch.addEventListener('characteristicvaluechanged', onHrValue);
      setStatus('Recibiendo frecuencia cardiaca…');
    } catch {
      // si no tiene HR, no es error
    }
  }, [onHrValue]);

  const tryFitnessMachinePeek = useCallback(async (server) => {
    try {
      await server.getPrimaryService(FITNESS_MACHINE);
      setStatus((s) => (s.includes('Frecuencia') ? s : 'Conectado (máquina BLE detectada)'));
    } catch {
      // ignorar si no existe
    }
  }, []);

  const handleScanWeb = useCallback(async () => {
    setError('');
    setStatus('Escaneando dispositivos…');
    setHr(null);
    setSamples(0);

    try {
      // HR_SERVICE solo en web
      const HR_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [HR_SERVICE, FITNESS_MACHINE, DEVICE_INFO],
      });

      setDeviceName(device?.name || 'Dispositivo BLE');
      deviceRef.current = device;

      device.addEventListener('gattserverdisconnected', () => {
        setConnected(false);
        setStatus('Desconectado');
      });

      setStatus('Conectando…');
      const server = await device.gatt.connect();
      serverRef.current = server;
      setConnected(true);
      setStatus('Conectado');

      await connectHeartRateIfPresent(server);
      await tryFitnessMachinePeek(server);
    } catch (err) {
      if (err?.name === 'NotFoundError') {
        setStatus('Cancelado por el usuario');
      } else {
        setStatus('Error');
        setError(err?.message || String(err));
      }
    }
  }, [connectHeartRateIfPresent, tryFitnessMachinePeek]);

  const handleDisconnectWeb = useCallback(async () => {
    setError('');
    try {
      if (hrCharRef.current) {
        try { await hrCharRef.current.stopNotifications(); } catch {}
        try { hrCharRef.current.removeEventListener('characteristicvaluechanged', onHrValue); } catch {}
      }
      deviceRef.current?.gatt?.disconnect();
      setConnected(false);
      setStatus('Desconectado');
      setDeviceName('');
    } catch (err) {
      setError(err?.message || String(err));
    }
  }, [onHrValue]);

  // --- Handlers Nativos (opcionales, no truenan si no hay lib) ---
  const handleConnectNative = useCallback(async () => {
    setError('');
    setStatus('Buscando dispositivos…');
    setHr(null);
    setSamples(0);

    try {
      if (!BLE.connect) {
        setStatus('No disponible');
        setError('BLE nativo no integrado. Agrega "@/lib/bleNative" con connect/disconnect/startHeartRate/stopHeartRate.');
        return;
      }
      console.log('[BLE] Using bridge only');
      await BLE.connect();
      await BLE.startHeartRate((bpm) => {
        setHr(bpm);
        setSamples((n) => n + 1);
        if (typeof onHr === 'function') onHr(bpm);
      });
      setConnected(true);
      setStatus('Conectado');
    } catch (err) {
      setStatus('Error');
      setError(err?.message || String(err));
    }
  }, [onHr]);

  const handleDisconnectNative = useCallback(async () => {
    setError('');
    try {
      await BLE.stopHeartRate();
      await BLE.disconnect();
      setConnected(false);
      setStatus('Desconectado');
      setDeviceName('');
    } catch (err) {
      setError(err?.message || String(err));
    }
  }, []);

  // --- Render ---
  return (
    <KeepAliveAccordion title="Equipos del gimnasio (Bluetooth)" defaultOpen>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        {/* Rama Nativa (APK) */}
        {isNative ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">
                  Estado: <span className="opacity-100">{status}</span>
                  {deviceName ? <> — <span className="opacity-100">{deviceName}</span></> : null}
                </p>
                {connected && hr != null && (
                  <p className="text-sm mt-1">
                    <span className="opacity-80">Frecuencia cardiaca: </span>
                    <span className="font-semibold">{hr} bpm</span>
                    <span className="opacity-60"> (muestras: {samples})</span>
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {!connected ? (
                  <button
                    onClick={handleConnectNative}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                  >
                    Conectar BLE (nativo)
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnectNative}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                  >
                    Desconectar
                  </button>
                )}
              </div>
            </div>

            <div className="text-xs opacity-70 mt-2">
              <p>
                Este flujo usa el <strong>plugin nativo</strong> de BLE vía Capacitor. Si no ves conexión,
                valida que exista <code>@/lib/bleNative</code> y permisos en runtime.
              </p>
              {error && <p className="mt-2 text-red-300">Error: {error}</p>}
            </div>
          </>
        ) : (
          // Rama Web
          <>
            {!webBleOk ? (
              <div className="text-sm opacity-80">
                <p className="mb-2 font-medium">Bluetooth no soportado</p>
                <p>
                  Tu navegador/dispositivo no soporta <strong>Web Bluetooth</strong>.
                  En Android/Chrome funciona la demo. En iOS/Safari no está disponible.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">
                      Estado: <span className="opacity-100">{status}</span>
                      {deviceName ? <> — <span className="opacity-100">{deviceName}</span></> : null}
                    </p>
                    {connected && hr != null && (
                      <p className="text-sm mt-1">
                        <span className="opacity-80">Frecuencia cardiaca: </span>
                        <span className="font-semibold">{hr} bpm</span>
                        <span className="opacity-60"> (muestras: {samples})</span>
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!connected ? (
                      <button
                        onClick={handleScanWeb}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                      >
                        Buscar / Conectar (Web)
                      </button>
                    ) : (
                      <button
                        onClick={handleDisconnectWeb}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                      >
                        Desconectar
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs opacity-70 mt-2">
                  <p>
                    Si tu banda/cinta expone el servicio de <em>Frecuencia Cardíaca</em> (UUID HR), verás el pulso en vivo.<br/>
                    Las máquinas FTMS (caminadora/bicicleta) pueden anunciarse pero no siempre permiten lectura sin control propietario.
                  </p>
                  {error && <p className="mt-2 text-red-300">Error: {error}</p>}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </KeepAliveAccordion>
  );
}
//
