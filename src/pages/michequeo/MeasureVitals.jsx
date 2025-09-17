
import React, { useState } from "react";
import BLEConnect from "../../components/BLEConnect";
import {
  ensureHealthConnectInstalledAndroid,
  requestHealthPermissions,
  readHeartRateToday,
  readStepsToday,
  readSleepLastNight,
} from "../../lib/health";

export default function MeasureVitals() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [hr, setHr] = useState(null);
  const [steps, setSteps] = useState(null);
  const [sleep, setSleep] = useState(null);

  async function syncNow() {
    try {
      setLoading(true);
      setMsg("Sincronizando…");
      await ensureHealthConnectInstalledAndroid();
      await requestHealthPermissions();
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12, padding: 12 }}>
      <h2>Mi Chequeo</h2>

      <button onClick={syncNow} disabled={loading}>
        {loading ? "Sincronizando…" : "Conectar con Salud del teléfono"}
      </button>
      <div>{msg}</div>

      <section style={{ display: "grid", gap: 8 }}>
        <div>❤️ Ritmo actual: {hr ?? "—"} bpm</div>
        <div>👣 Pasos hoy: {steps ?? "—"}</div>
        <div>🛌 Sueño: {sleep ? fmtSleep(sleep) : "—"}</div>
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