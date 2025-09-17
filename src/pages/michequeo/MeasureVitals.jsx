
import React, { useState } from "react";
import BLEConnect from "../../components/BLEConnect";
import {
  ensureHealthReady,
  readHeartRateToday,
  readStepsToday,
  readSleepLastNight,
} from "../../lib/health";

export default function MeasureVitals() {
  const [uiState, setUiState] = useState('idle');
  const [msg, setMsg] = useState("");
  const [hr, setHr] = useState(null);
  const [steps, setSteps] = useState(null);
  const [sleep, setSleep] = useState(null);

  async function onConnectHealth() {
    setUiState('checking');
    const res = await ensureHealthReady();
    if (!res.available) {
      setUiState(res.reason === 'HEALTH_CONNECT_NOT_AVAILABLE' ? 'hc-missing' : 'hc-perms-denied');
      return;
    }
    setUiState('ready');
    setMsg('Sincronizando…');
    try {
      const [hrArr, st, sl] = await Promise.all([
        readHeartRateToday(),
        readStepsToday(),
        readSleepLastNight(),
      ]);
      setHr(hrArr?.length ? hrArr[hrArr.length - 1].bpm : null);
      setSteps(st ?? null);
      setSleep(sl ?? null);
      setMsg("Listo ✅");
    } catch (e) {
      setMsg(e?.message ?? String(e));
    }
  }

  // Card de fallback si no hay Health Connect
  function InlineCard({ title, text, primary, secondary }) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, margin: '16px 0', border: '1px solid #fff2' }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 14, marginBottom: 12 }}>{text}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {primary && <button onClick={primary.onClick} style={{ background: '#FFB300', color: '#222', borderRadius: 8, padding: '6px 14px', fontWeight: 500 }}>{primary.label}</button>}
          {secondary && <button onClick={secondary.onClick} style={{ background: 'transparent', color: '#FFB300', borderRadius: 8, padding: '6px 14px', fontWeight: 500, border: '1px solid #FFB300' }}>{secondary.label}</button>}
        </div>
      </div>
    );
  }

  // Fallback para abrir BLE
  function openBLE() {
    setUiState('ble');
  }

  return (
    <div style={{ display: "grid", gap: 12, padding: 12 }}>
      <h2>Mi Chequeo</h2>

      <button onClick={onConnectHealth} disabled={uiState==='checking'}>
        {uiState==='checking' ? "Sincronizando…" : "Conectar con Salud del teléfono"}
      </button>
      <div>{msg}</div>

      {uiState==='hc-missing' && (
        <InlineCard
          title="Salud del teléfono no disponible"
          text="Este dispositivo no tiene el contenedor de Salud habilitado. Puedes usar un sensor BLE como alternativa."
          primary={{label:'Usar sensor BLE', onClick: openBLE}}
          secondary={{label:'Ver requisitos', onClick: ()=>setUiState('help')}}
        />
      )}

      <section style={{ display: "grid", gap: 8 }}>
        <div>Ritmo cardiaco: {hr ?? "—"} bpm</div>
        <div>Pasos: {steps ?? "—"}</div>
        <div>Sueño: {sleep ? fmtSleep(sleep) : "—"}</div>
      </section>

      <section style={{ marginTop: 12 }}>
        <h3>Sensor BLE (opcional)</h3>
        <BLEConnect />
      </section>
    </div>
  );
}

function fmtSleep(s) {
  if (!s?.start || !s?.end) return "—";
  const start = new Date(s.start);
  const end = new Date(s.end);
  const mins = Math.round((end - start) / 60000);
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  const rem = (s.stages || []).filter(x => x.stage === "sleep.rem").length;
  return `${hrs}h ${m}m ${rem ? `(REM x${rem})` : ""}`;
}