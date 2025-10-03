import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import KeepAliveAccordion from '@/components/ui/KeepAliveAccordion';
import { sessionHub } from '@/fit/sessionHub';
import {
  startScan,
  stopScan as stopBleScan,
  connectFlow,
  getIsScanning,
  getIsConnecting,
  getConnectedDeviceId,
} from '@/ble/ble';

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
  const [status, setStatus] = useState('Idle'); // Idle|Pidiendo permisos|Escaneando|Detenido|Error
  const [error, setError] = useState('');
  const [devices, setDevices] = useState([]); // {id,name,rssi, uuids?}
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(null);
  // Estado de conexión (nativo)
  const [connState, setConnState] = useState('Idle'); // Idle | Conectando… | Conectado | No soportado | Error
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null); // {id,name,rssi}
  const [connectedInfo, setConnectedInfo] = useState(null); // {deviceId, hasHr, hasFtms, type, batteryPct}
  const [hrLive, setHrLive] = useState(null);
  const [batteryPct, setBatteryPct] = useState(undefined);
  const [autoReconnect, setAutoReconnect] = useState(() => {
    try { return localStorage.getItem('ble_auto_reconnect') === '1'; } catch { return false; }
  });
  const [onlyFitness, setOnlyFitness] = useState(() => {
    try { return localStorage.getItem('ble_only_fitness') === '1'; } catch { return false; }
  });
  const lastConnectedIdRef = useRef(() => {
    try { return localStorage.getItem('ble_last_device_id') || ''; } catch { return ''; }
  });
  const disconnectFnRef = useRef(null);
  const voluntaryDisconnectRef = useRef(false);
  // Estado Web Bluetooth (para la rama web)
  const [hr, setHr] = useState(null);
  const [samples, setSamples] = useState(0);
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
      // unmount safe: detener escaneo y timers
      try { stopBleScan(); } catch {}
      if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
      // Desconexión limpia si quedó algo activo
      voluntaryDisconnectRef.current = true;
      if (disconnectFnRef.current) { disconnectFnRef.current().catch(() => {}); disconnectFnRef.current = null; }
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
    setError('');
    setDevices([]);
    setStatus('Pidiendo permisos');
    try {
      // Inicia countdown 15s cuando empiece el escaneo
      await startScan((d) => {
        setDevices(prev => {
          if (prev.find(x => x.id === d.deviceId)) return prev; // anti-duplicados por deviceId
          return [...prev, { id: d.deviceId, name: d.name || 'Sin nombre', rssi: d.rssi }];
        });
      });
      setStatus('Escaneando');
      setCountdown(15);
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
            setStatus('Detenido');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (e) {
      const msg = String(e?.message || e);
      if (msg.includes('BLE_PERMISSIONS_DENIED')) setError('Permisos de Bluetooth/Ubicación requeridos');
      else if (msg.includes('BLE_ADAPTER_OFF')) setError('Bluetooth apagado. Enciéndelo para escanear.');
      else setError('BLE_SCAN_ERROR');
      setStatus('Error');
    }
  }, []);

  // --- Conexión: UI handlers ---
  const openConnectModal = useCallback((d) => {
    if (!isNative) return; // flujo nativo solamente en APK
    setSelected(d);
    setConnState('Idle');
    setModalOpen(true);
  }, [isNative]);

  const handleConnect = useCallback(async () => {
    if (!selected) return;
    if (getIsConnecting() || getConnectedDeviceId()) return;
    // bloquear escaneo mientras conecta
    if (getIsScanning()) { try { await stopBleScan(); } catch {} }
    setConnState('Conectando…');
    setError('');
    setHrLive(null);
    setBatteryPct(undefined);
    try {
      const res = await connectFlow({
        deviceId: selected.id,
        onHr: (bpm) => { setHrLive(bpm); sessionHub.onHr(bpm); if (typeof onHr === 'function') onHr(bpm); },
        onAdapterOff: () => {
          setConnState('Error');
          setError('BLE_ADAPTER_OFF');
          setModalOpen(false);
        },
        timeoutMs: 10000,
      });
      setConnectedInfo(res);
      setBatteryPct(res.batteryPct);
      if (typeof res.batteryPct === 'number') {
        try { sessionHub.onBattery(res.batteryPct); } catch {}
      }
      setConnState(res.type === 'Unknown' ? 'No soportado' : 'Conectado');
      disconnectFnRef.current = res.disconnect;
      // persistencia
      try { localStorage.setItem('ble_last_device_id', res.deviceId); } catch {}
    } catch (e) {
      const msg = String(e?.message || e);
      if (msg.includes('BLE_CONNECT_TIMEOUT')) setError('BLE_CONNECT_TIMEOUT');
      else setError('BLE_CONNECT_FAILED');
      setConnState('Error');
      // Reintento único a los 3s si auto-reconectar activo
      if (autoReconnect) {
        setTimeout(() => {
          if (!getConnectedDeviceId() && !getIsConnecting()) {
            handleConnect();
          }
        }, 3000);
      }
    }
  }, [selected, onHr]);

  const handleDisconnect = useCallback(async () => {
    voluntaryDisconnectRef.current = true;
    try { if (disconnectFnRef.current) await disconnectFnRef.current(); } catch {}
    disconnectFnRef.current = null;
    setConnectedInfo(null);
    setConnState('Idle');
    setHrLive(null);
    setBatteryPct(undefined);
    setModalOpen(false);
  }, []);

  // Persistencia toggles
  const onToggleAutoReconnect = useCallback(() => {
    setAutoReconnect((v) => {
      const nv = !v;
      try { localStorage.setItem('ble_auto_reconnect', nv ? '1' : '0'); } catch {}
      return nv;
    });
  }, []);
  const onToggleOnlyFitness = useCallback(() => {
    setOnlyFitness((v) => {
      const nv = !v;
      try { localStorage.setItem('ble_only_fitness', nv ? '1' : '0'); } catch {}
      return nv;
    });
  }, []);

  // Auto-reconnect básico (si el dispositivo aparece en la lista y toggle activo) – no bloquea UI
  useEffect(() => {
    if (!autoReconnect) return;
    const lastId = (() => { try { return localStorage.getItem('ble_last_device_id') || ''; } catch { return ''; } })();
    if (!lastId || getConnectedDeviceId() || getIsConnecting()) return;
    const found = devices.find((d) => d.id === lastId);
    if (found) {
      // intentar una vez
      (async () => {
        try {
          setSelected(found);
          await handleConnect();
        } catch {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices]);

  // Emparejamiento FTMS/HR se hará en PR2; aquí solo escaneo sólido.

  // --- Render ---
  return (
  <KeepAliveAccordion title="Dispositivos Bluetooth" defaultOpen>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        {/* Rama Nativa (APK) */}
        {isNative ? (
          <>
            <div className="mb-3 flex flex-col gap-2">
              <div className="flex gap-2 mb-2">
                <button onClick={onScan} disabled={getIsConnecting()} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50">Escanear</button>
                <button onClick={() => { try { stopBleScan(); } catch {}; if (countdownRef.current){ clearInterval(countdownRef.current); countdownRef.current = null; } setStatus('Detenido'); }} disabled={getIsConnecting()} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50">Detener</button>
              </div>
              <div className="overflow-x-auto">
                <div className="flex items-center gap-3 mb-2">
                  <label className="flex items-center gap-1 text-xs opacity-80">
                    <input type="checkbox" checked={onlyFitness} onChange={onToggleOnlyFitness} /> Solo fitness
                  </label>
                </div>
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="px-2">Nombre</th>
                      <th className="px-2">RSSI</th>
                      <th className="px-2">ID</th>
                      <th className="px-2">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices
                      .filter(d => !onlyFitness || true) // placeholder: si tuviéramos uuids, filtrar por 0x180D / 0x1826
                      .map(d => (
                        <tr key={d.id} className="hover:bg-white/10 cursor-pointer" onClick={() => openConnectModal(d)}>
                          <td className="px-2">{d.name}</td>
                          <td className="px-2">{d.rssi ?? '-'}</td>
                          <td className="px-2 text-[10px] opacity-80">{d.id}</td>
                          <td className="px-2">
                            <button
                              className="px-2 py-1 rounded bg-vita-orange text-black hover:brightness-110 transition"
                              onClick={(e) => { e.stopPropagation(); openConnectModal(d); }}
                            >Conectar</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2">
                <p className="text-sm opacity-80">Estado: <span className="opacity-100">{status}{status==='Escaneando' && countdown>0 ? ` (${countdown}s)` : ''}</span></p>
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
              {status === 'Escaneando' && devices.length === 0 && !error && (
                <div className="mt-2 text-yellow-200 text-xs">Buscando dispositivos... Asegúrate de que tu banda o máquina esté encendida y cerca. Activa Bluetooth y Ubicación.</div>
              )}
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

      {/* Bottom Sheet modal conexión */}
      {isNative && modalOpen && createPortal((
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" style={{pointerEvents:'auto'}}>
          <div className="w-full max-w-lg bg-[#0b1626] border border-white/10 rounded-t-2xl sm:rounded-2xl p-4 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm opacity-80">{selected?.id}</div>
                <div className="text-lg font-semibold">{selected?.name || 'Sin nombre'}</div>
              </div>
              <button className="text-white/70 hover:text-white" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <div className="text-sm mb-2">
              Estado: {connState}
              {connState === 'Conectado' && connectedInfo?.type ? (
                <span className="ml-2 opacity-80">[{connectedInfo.type}]</span>
              ) : null}
            </div>

            {connState === 'Conectado' && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {connectedInfo?.hasHr && (
                  <div className="rounded border border-white/10 p-2">
                    <div className="text-xs opacity-70">Pulso actual</div>
                    <div className="text-lg font-bold">{hrLive ?? '—'} {hrLive != null ? 'bpm' : ''}</div>
                  </div>
                )}
                {typeof batteryPct === 'number' && (
                  <div className="rounded border border-white/10 p-2">
                    <div className="text-xs opacity-70">Batería</div>
                    <div className="text-lg font-bold">{batteryPct}%</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs opacity-80">
                <input type="checkbox" checked={autoReconnect} onChange={onToggleAutoReconnect} /> Auto-reconectar
              </label>
              <div className="flex gap-2">
                {connState !== 'Conectado' ? (
                  <button
                    disabled={getIsConnecting()}
                    onClick={handleConnect}
                    className="px-4 py-2 rounded-lg bg-vita-orange text-black hover:brightness-110 disabled:opacity-60"
                  >Conectar</button>
                ) : (
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                  >Desconectar</button>
                )}
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">Cancelar</button>
              </div>
            </div>

            {error && <div className="mt-2 text-xs text-red-300">{error}</div>}
          </div>
        </div>
  ), document.body)}
    </KeepAliveAccordion>
  );
}
