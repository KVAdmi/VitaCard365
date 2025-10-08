import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { BleClient, numberToUUID, type ScanResult } from '@capacitor-community/bluetooth-le';
import { AlertTriangle, Bluetooth, Scan, PlugZap } from 'lucide-react';

type Device = { deviceId: string; name?: string|null };

const BP_SERVICE = '1810';
const HR_SERVICE = '180D';

export default function BLECardUnified() {
  const isNative = Capacitor.getPlatform() !== 'web';
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string|null>(null);

  useEffect(()=>{ (async()=>{ try { await BleClient.initialize(); } catch {} })(); },[]);

  async function startScan() {
    setError(null);
    if (!isNative) { setError('El escaneo nativo requiere la app instalada.'); return; }
    try {
      setScanning(true); setDevices([]);
      await BleClient.requestLEScan({
        allowDuplicates: false,
        services: [numberToUUID(0x1810), numberToUUID(0x180D)],
      }, (res: ScanResult) => {
        const name = res?.localName || 'Dispositivo';
        setDevices(prev => {
          if (prev.find(d => d.deviceId === res.device.deviceId)) return prev;
          return [...prev, { deviceId: res.device.deviceId, name }];
        });
      });
    } catch (e:any) {
      setError(e?.message || String(e));
    }
  }

  async function stopScan() {
    try { await BleClient.stopLEScan(); } catch {}
    setScanning(false);
  }

  async function connect(deviceId: string) {
    try {
      await BleClient.connect(deviceId);
      alert('Conectado. Abre la tarjeta de Signos Vitales para iniciar notificaciones.');
    } catch (e:any) {
      setError(e?.message || String(e));
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Bluetooth className="h-5 w-5 text-blue-300"/>
          <div className="font-semibold">Bluetooth</div>
        </div>
        <div className="flex gap-2">
          {!scanning ? (
            <button onClick={startScan} className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/10 text-white hover:bg-white/15 flex items-center gap-1">
              <Scan className="h-4 w-4"/> Escanear
            </button>
          ) : (
            <button onClick={stopScan} className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/10 text-white hover:bg-white/15">Detener</button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-yellow-400/40 bg-yellow-400/10 p-3 text-yellow-200 text-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5"/> {error}
        </div>
      )}

      <div className="mt-3">
        {devices.length === 0 ? (
          <div className="text-sm text-white/70">No hay dispositivos detectados aún.</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {devices.map(d => (
              <li key={d.deviceId} className="py-2 flex items-center justify-between gap-2">
                <div>
                  <div className="text-white text-sm font-medium">{d.name || 'Dispositivo'}</div>
                  <div className="text-xs text-white/50">{d.deviceId}</div>
                </div>
                <button onClick={()=>connect(d.deviceId)} className="px-3 py-1.5 rounded-lg border border-cyan-300/30 bg-cyan-400/10 text-cyan-100/90 hover:bg-cyan-400/20 flex items-center gap-1">
                  <PlugZap className="h-4 w-4"/> Conectar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 text-xs text-white/60">
        Nota: Apple Watch no permite emparejar por BLE con apps de terceros. Usa dispositivos estándar (tensiómetro 0x1810, HR 0x180D).
      </div>
    </div>
  );
}
