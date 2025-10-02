import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import KeepAliveAccordion from '@/components/ui/KeepAliveAccordion';
import { scanFtmsHr, connect, subscribeFtms, subscribeHr, stopNotifications, disconnect } from '@/ble/ble';

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

  // Estado UI BLE nativo
  const [status, setStatus] = useState('Idle'); // Idle|Scanning|Connecting|Streaming|Reconnecting|Error
  const [error, setError] = useState('');
  const [devices, setDevices] = useState([]); // {id,name,rssi,hasFTMS,hasHR}
  const [sel, setSel] = useState(null); // device seleccionado
  const [hr, setHr] = useState(null);
  const [samples, setSamples] = useState(0);
  const [metrics, setMetrics] = useState({}); // buffer FTMS/HR
  // Estado BLE Web
  const [deviceName, setDeviceName] = useState('');
  const [connected, setConnected] = useState(false);

  // Refs Web Bluetooth
  const deviceRef = useRef(null);
  const serverRef = useRef(null);
  const hrCharRef = useRef(null);

  // Import estático: BLE bridge siempre disponible, solo se usa en nativo

  // Limpieza al desmontar (Web y nativo)
  useEffect(() => {
    return () => {
      stopNotifications();
    };
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


  // --- Handlers BLE nativo (Capacitor BLE wrapper) ---
  const onScan = useCallback(async () => {
    setDevices([]); setStatus('Scanning');
    await scanFtmsHr((r) => {
      setDevices(prev => {
        const already = prev.find(d => d.id === r.device.deviceId);
        if (already) return prev;
        return [...prev, {
          id: r.device.deviceId,
          name: r.device.name || 'Unknown',
          rssi: r.device.rssi,
          hasFTMS: r.device.uuids?.some(u => u?.toLowerCase().includes('1826')),
          hasHR:   r.device.uuids?.some(u => u?.toLowerCase().includes('180d')),
        }];
      });
    });
  }, []);

  const onConnect = useCallback(async (d) => {
    setSel(d); setStatus('Connecting'); await stopNotifications();
    setHr(null); setSamples(0); setMetrics({});
    try {
      await subscribeFtms(d.id, ['2AD2','2ACD','2AD1','2ACE'], buf => {
        // Aquí parsea FTMS y actualiza metrics
        // Ejemplo: setMetrics(m => ({ ...m, ...parseFtms(buf) }));
      });
      await subscribeHr(d.id, bpm => {
        setHr(bpm);
        setSamples(n => n + 1);
        if (typeof onHr === 'function') onHr(bpm);
      });
      setStatus('Streaming');
    } catch (e) {
      setStatus('Error');
    }
  }, [onHr]);

  const onDisconnect = useCallback(async () => {
    setSel(null); setStatus('Idle'); setHr(null); setSamples(0); setMetrics({});
    await stopNotifications();
  }, []);

  // --- Render ---
  return (
  <KeepAliveAccordion title="Dispositivos Bluetooth" defaultOpen>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        {/* Rama Nativa (APK) */}
        {isNative ? (
          <>
            <div className="mb-3 flex flex-col gap-2">
              <div className="flex gap-2 mb-2">
                <button onClick={onScan} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">Escanear 25s</button>
                <button onClick={stopNotifications} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">Detener</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="px-2">Nombre</th>
                      <th className="px-2">RSSI</th>
                      <th className="px-2">Etiquetas</th>
                      <th className="px-2">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map(d => (
                      <tr key={d.id} className={sel?.id === d.id ? 'bg-white/10' : ''}>
                        <td className="px-2">{d.name}</td>
                        <td className="px-2">{d.rssi ?? '-'}</td>
                        <td className="px-2">
                          {d.hasFTMS && <span className="bg-blue-500 text-white px-1 rounded mr-1">FTMS</span>}
                          {d.hasHR && <span className="bg-pink-500 text-white px-1 rounded">HR</span>}
                        </td>
                        <td className="px-2">
                          <button onClick={() => onConnect(d)} className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition">Conectar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sel && (
                <div className="mt-2">
                  <button onClick={onDisconnect} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">Desconectar</button>
                </div>
              )}
              <div className="mt-2">
                <p className="text-sm opacity-80">Estado: <span className="opacity-100">{status}</span></p>
                {hr != null && (
                  <p className="text-sm mt-1">
                    <span className="opacity-80">Frecuencia cardiaca: </span>
                    <span className="font-semibold">{hr} bpm</span>
                    <span className="opacity-60"> (muestras: {samples})</span>
                  </p>
                )}
                {/* Aquí puedes renderizar métricas FTMS del buffer */}
              </div>
              {error && <div className="mt-2 text-red-300 text-xs">Error: {error}</div>}
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
