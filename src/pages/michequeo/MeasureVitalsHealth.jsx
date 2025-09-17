import React, { useState } from "react";
import {
  ensureHealthConnectInstalledAndroid,
  requestHealthPermissions,
  readHeartRateToday,
  readSleepLastNight,
  readStepsToday,
} from "../../lib/health";
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';

export default function MeasureVitalsHealth() {
  const [loading, setLoading] = useState(false);
  const [hr, setHr] = useState(null);
  const [steps, setSteps] = useState(null);
  const [sleep, setSleep] = useState(null);
  const [msg, setMsg] = useState("");

  const syncNow = async () => {
    try {
      setLoading(true); setMsg("Sincronizando...");
      await ensureHealthConnectInstalledAndroid();
      await requestHealthPermissions();
      const [hrArr, st, sl] = await Promise.all([
        readHeartRateToday(),
        readStepsToday(),
        readSleepLastNight()
      ]);
      setHr(hrArr.length ? hrArr[hrArr.length - 1].bpm : null);
      setSteps(st);
      setSleep(sl);
      setMsg("Listo");
    } catch (e) {
      setMsg(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button disabled={loading} onClick={syncNow} className="w-full bg-vita-orange">
        {loading ? "Sincronizando..." : "Conectar con Salud del teléfono"}
      </Button>
      {msg && <Alert className="mt-2">{msg}</Alert>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="icon-hr mx-auto mb-2" />
          <div className="text-lg font-semibold text-white">Ritmo actual</div>
          <div className="text-3xl text-vita-red font-bold mt-2">{hr ?? "—"} <span className="text-base font-normal">bpm</span></div>
        </div>
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="icon-steps mx-auto mb-2" />
          <div className="text-lg font-semibold text-white">Pasos hoy</div>
          <div className="text-3xl text-vita-green font-bold mt-2">{steps ?? "—"}</div>
        </div>
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="icon-sleep mx-auto mb-2" />
          <div className="text-lg font-semibold text-white">Sueño</div>
          <div className="text-3xl text-vita-blue font-bold mt-2">{sleep ? fmtSleep(sleep) : "—"}</div>
        </div>
      </div>
    </div>
  );
}

function fmtSleep(s) {
  const mins = Math.round((s.end - s.start) / 60000);
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  const rem = s.stages.filter(x => x.stage === "sleep.rem").length;
  return `${hrs}h ${m}m (${rem} REM)`;
}
