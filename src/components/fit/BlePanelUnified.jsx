import React, { useEffect } from 'react';
import GymBlePanel from './GymBlePanel';
import { useNativeHeartRate } from '@/hooks/useNativeHeartRate';

export default function BlePanelUnified({ onHr }) {
  // Reloj / banda HR nativa (HRS 0x180D)
  const { status: hrStatus, error: hrError, hr, scanAndConnect, disconnect } = useNativeHeartRate();
  useEffect(() => { if (hr != null && typeof onHr === 'function') onHr(hr); }, [hr, onHr]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* Panel de máquinas / Web Bluetooth / FTMS */}
      <div className="rounded-xl border border-cyan-300/30 bg-white/5 p-3">
        <div className="text-sm text-white/80 mb-2">Máquinas y sensores (FTMS/Web Bluetooth)</div>
        <GymBlePanel onHr={onHr} />
      </div>

      {/* Panel de reloj/monitor (HRS nativo) */}
      <div className="rounded-xl border border-cyan-300/30 bg-white/5 p-3">
        <div className="text-sm text-white/80 mb-2">Reloj o monitor de pulso (BLE nativo)</div>
        <div className="text-sm text-white/80 mb-2">Estado: {hrStatus}{hrError?` — ${hrError}`:''}</div>
        <div className="flex gap-2">
          <button onClick={scanAndConnect} className="px-3 py-1.5 rounded-lg border border-cyan-300/30 bg-cyan-400/10 hover:bg-cyan-400/20">Buscar y conectar</button>
          <button onClick={disconnect} className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10">Desconectar</button>
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/10 bg-[#0b1626]/70 backdrop-blur text-white tabular-nums tracking-wide px-3 py-2">
            <div className="text-xs text-white/70">Pulso (reloj)</div>
            <div className="text-lg font-semibold">{hr!=null?`${hr} bpm`:'—'}</div>
          </div>
        </div>
        <div className="text-xs text-white/60 mt-2">Al conectar, el pulso del reloj alimenta el HUD y tu sesión.</div>
      </div>
    </div>
  );
}
