
import React, { useState } from "react";

import { useNavigate } from 'react-router-dom';
import CameraPPG from "../../components/michequeo/CameraPPG";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import BLEConnect from "../../components/BLEConnect";
import VitalForm from "../../components/michequeo/VitalForm";
import {
  ensureHealthReady,
  readHeartRateToday,
  readStepsToday,
  readSleepLastNight,
} from "../../lib/health";

export default function MeasureVitals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uiState, setUiState] = useState('idle');
  const [msg, setMsg] = useState("");
  const [hr, setHr] = useState(null);
  const [steps, setSteps] = useState(null);
  const [sleep, setSleep] = useState(null);
  const [mode, setMode] = useState('auto'); // 'auto' | 'manual' | 'camera'
  const [manualType, setManualType] = useState('bp'); // 'bp' | 'glucose' | 'spo2'
  const [feedback, setFeedback] = useState(null); // {visible, data}

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

      {/* Botón de regreso */}
      <div className="flex items-center p-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-white hover:text-vita-orange font-semibold text-base focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Regresar
        </button>
      </div>
      <h2>Mi Chequeo</h2>

      {/* Selector de modo */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setMode('auto')}
          style={{
            background: mode === 'auto' ? '#f06340' : 'rgba(255,255,255,0.08)',
            color: mode === 'auto' ? '#fff' : '#f06340',
            border: '1px solid #f06340',
            borderRadius: 8,
            padding: '8px 18px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >Sincronizar dispositivo</button>
        <button
          onClick={() => setMode('manual')}
          style={{
            background: mode === 'manual' ? '#f06340' : 'rgba(255,255,255,0.08)',
            color: mode === 'manual' ? '#fff' : '#f06340',
            border: '1px solid #f06340',
            borderRadius: 8,
            padding: '8px 18px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >Registro manual</button>
        <button
          onClick={() => setMode('camera')}
          style={{
            background: mode === 'camera' ? '#f06340' : 'rgba(255,255,255,0.08)',
            color: mode === 'camera' ? '#fff' : '#f06340',
            border: '1px solid #f06340',
            borderRadius: 8,
            padding: '8px 18px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >Medir con cámara</button>
      </div>

      {/* Tarjeta de feedback post-medición */}
      {feedback?.visible && (
        <div className="glass-card p-6 rounded-2xl shadow-xl border border-white/20 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-bold" style={{color:feedback.color}}>{feedback.titulo}</span>
            <button onClick={()=>setFeedback(f=>({...f,visible:false}))} className="text-white/60 hover:text-[#f06340] text-xl">×</button>
          </div>
          <div className="text-2xl font-bold mb-2" style={{color:feedback.color}}>{feedback.valor}</div>
          <div className="text-sm text-white/80 mb-2">{feedback.diagnostico}</div>
          <div className="text-xs text-white/60">{feedback.detalle}</div>
        </div>
      )}

      {mode === 'auto' && (
        <>
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
        </>
      )}

      {mode === 'manual' && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => setManualType('bp')}
              style={{
                background: manualType === 'bp' ? '#f06340' : 'rgba(255,255,255,0.08)',
                color: manualType === 'bp' ? '#fff' : '#f06340',
                border: '1px solid #f06340',
                borderRadius: 8,
                padding: '6px 14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >Presión arterial</button>
            <button
              onClick={() => setManualType('glucose')}
              style={{
                background: manualType === 'glucose' ? '#f06340' : 'rgba(255,255,255,0.08)',
                color: manualType === 'glucose' ? '#fff' : '#f06340',
                border: '1px solid #f06340',
                borderRadius: 8,
                padding: '6px 14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >Glucosa</button>
            <button
              onClick={() => setManualType('spo2')}
              style={{
                background: manualType === 'spo2' ? '#f06340' : 'rgba(255,255,255,0.08)',
                color: manualType === 'spo2' ? '#fff' : '#f06340',
                border: '1px solid #f06340',
                borderRadius: 8,
                padding: '6px 14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >SpO₂</button>
          </div>
          {manualType === 'bp' && (
            <VitalForm
              fields={[
                { name: 'systolic', label: 'Presión Sistólica (mmHg)', type: 'tel', placeholder: 'Ej: 120' },
                { name: 'diastolic', label: 'Presión Diastólica (mmHg)', type: 'tel', placeholder: 'Ej: 80' },
                { name: 'pulse', label: 'Pulso (bpm)', type: 'tel', placeholder: 'Ej: 70' },
                { name: 'arm', label: 'Brazo', type: 'text', placeholder: 'Izquierdo/Derecho' },
                { name: 'posture', label: 'Postura', type: 'text', placeholder: 'Sentado/De pie/Acostado' },
                { name: 'ts', label: 'Fecha y hora', type: 'datetime-local', placeholder: '' },
              ]}
              submitText="Guardar medición"
              onSubmit={async data => {
                // Validación básica
                const systolic = Number(data.systolic), diastolic = Number(data.diastolic), pulse = Number(data.pulse);
                if (isNaN(systolic) || isNaN(diastolic) || systolic < 60 || systolic > 250 || diastolic < 30 || diastolic > 150) {
                  setFeedback({visible:true, color:'#f06340', titulo:'Error', valor:'-', diagnostico:'Valores fuera de rango', detalle:'Verifica los datos ingresados.'});
                  return;
                }
                // Guardar en Supabase
                const { error } = await supabase.from('vital_signs').insert([{
                  user_uuid: user.id,
                  type: 'bp',
                  value: systolic,
                  unit: 'mmHg',
                  ts: data.ts || new Date().toISOString(),
                  source: 'manual',
                  extra: { systolic, diastolic, pulse, arm: data.arm, posture: data.posture }
                }]);
                if (error) {
                  setFeedback({visible:true, color:'#f06340', titulo:'Error', valor:'-', diagnostico:'No se pudo guardar', detalle:error.message});
                  return;
                }
                // Diagnóstico simple
                let diag = 'Presión aceptable.';
                if (systolic >= 180 || diastolic >= 120) diag = 'ALERTA: Presión muy alta. Busca atención médica.';
                else if (systolic <= 90 || diastolic <= 60) diag = 'ALERTA: Presión baja. Consulta a tu médico.';
                setFeedback({visible:true, color:'#f06340', titulo:'Presión arterial', valor:`${systolic}/${diastolic} mmHg`, diagnostico:diag, detalle:'Registro guardado correctamente.'});
              }}
            />
          )}
          {manualType === 'glucose' && (
            <VitalForm
              fields={[
                { name: 'glucose', label: 'Glucosa (mg/dL)', type: 'tel', placeholder: 'Ej: 95' },
                { name: 'condicion', label: 'Condición', type: 'text', placeholder: 'Ayuno/Postprandial' },
                { name: 'ts', label: 'Fecha y hora', type: 'datetime-local', placeholder: '' },
              ]}
              submitText="Guardar medición"
              onSubmit={async data => {
                const glucose = Number(data.glucose);
                if (isNaN(glucose) || glucose < 40 || glucose > 600) {
                  setFeedback({visible:true, color:'#f06340', titulo:'Error', valor:'-', diagnostico:'Valor fuera de rango', detalle:'Verifica los datos ingresados.'});
                  return;
                }
                const { error } = await supabase.from('vital_signs').insert([{
                  user_uuid: user.id,
                  type: 'glucosa',
                  value: glucose,
                  unit: 'mg/dL',
                  ts: data.ts || new Date().toISOString(),
                  source: 'manual',
                  extra: { condicion: data.condicion }
                }]);
                if (error) {
                  setFeedback({visible:true, color:'#f06340', titulo:'Error', valor:'-', diagnostico:'No se pudo guardar', detalle:error.message});
                  return;
                }
                let diag = 'Glucosa normal.';
                if (glucose > 180) diag = 'ALERTA: Glucosa alta. Consulta a tu médico.';
                else if (glucose < 70) diag = 'ALERTA: Glucosa baja. Come algo y consulta.';
                setFeedback({visible:true, color:'#f06340', titulo:'Glucosa', valor:`${glucose} mg/dL`, diagnostico:diag, detalle:'Registro guardado correctamente.'});
              }}
            />
          )}
          {manualType === 'spo2' && (
            <VitalForm
              fields={[
                { name: 'spo2', label: 'SpO₂ (%)', type: 'tel', placeholder: 'Ej: 98' },
                { name: 'pulse', label: 'Pulso (bpm, opcional)', type: 'tel', placeholder: 'Ej: 70' },
                { name: 'ts', label: 'Fecha y hora', type: 'datetime-local', placeholder: '' },
              ]}
              submitText="Guardar medición"
              onSubmit={async data => {
                const spo2 = Number(data.spo2), pulse = Number(data.pulse);
                if (isNaN(spo2) || spo2 < 50 || spo2 > 100) {
                  setFeedback({visible:true, color:'#f06340', titulo:'Error', valor:'-', diagnostico:'Valor fuera de rango', detalle:'Verifica los datos ingresados.'});
                  return;
                }
                const { error } = await supabase.from('vital_signs').insert([{
                  user_uuid: user.id,
                  type: 'spo2',
                  value: spo2,
                  unit: '%',
                  ts: data.ts || new Date().toISOString(),
                  source: 'manual',
                  extra: { pulse }
                }]);
                if (error) {
                  setFeedback({visible:true, color:'#f06340', titulo:'Error', valor:'-', diagnostico:'No se pudo guardar', detalle:error.message});
                  return;
                }
                let diag = 'SpO₂ normal.';
                if (spo2 < 90) diag = 'ALERTA: SpO₂ bajo. Busca atención médica.';
                setFeedback({visible:true, color:'#f06340', titulo:'SpO₂', valor:`${spo2}%`, diagnostico:diag, detalle:'Registro guardado correctamente.'});
              }}
            />
          )}
      {mode === 'camera' && (
        <div style={{ marginTop: 16 }}>
          <CameraPPG onSaved={bpm => {
            let diag = 'Pulso normal.';
            if (bpm > 120) diag = 'ALERTA: Pulso elevado. Descansa y consulta si persiste.';
            else if (bpm < 50) diag = 'ALERTA: Pulso bajo. Consulta a tu médico.';
            setFeedback({visible:true, color:'#f06340', titulo:'Pulso (cámara)', valor:`${bpm} bpm`, diagnostico:diag, detalle:'Registro guardado correctamente.'});
          }} />
        </div>
      )}
        </div>
      )}
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