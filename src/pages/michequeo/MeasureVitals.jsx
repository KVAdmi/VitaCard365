
import React, { useState } from "react";
import VitaCard365Logo from "../../components/Vita365Logo";

import { useNavigate } from 'react-router-dom';
import CameraPPG from "../../components/michequeo/CameraPPG";
import { supabase } from "../../lib/supabaseClient";
import { getOrCreateLocalUserId } from "../../lib/getOrCreateLocalUserId";
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

      {/* Selector de modo (sin botón de sincronizar dispositivo) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
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
          {/* Tarjeta informativa profesional, logo grande, mensaje claro, SIN botón ni mensaje de sincronizar */}
          <div className="glass-card p-10 rounded-2xl shadow-xl border border-white/20 mb-10 flex flex-col items-center justify-center text-center animate-fade-in">
            <VitaCard365Logo className="w-52 h-52 mb-8" />
            <h3 className="text-3xl font-extrabold text-vita-blue-light mb-4">¡Registra tu historial de salud!</h3>
            <p className="text-white/90 text-lg max-w-2xl mx-auto mb-2">
              Guarda aquí tus mediciones de presión arterial, glucosa, oxigenación y pulso para construir un historial profesional y confiable. Este registro es clave para tus consultas médicas, seguimiento de tratamientos y para monitorear tu progreso a lo largo del tiempo.
            </p>
            <p className="text-white/60 text-base">Tu salud es tu mejor inversión.</p>
          </div>
          {/* Se eliminan las letras blancas de métricas y sensor BLE en modo auto, solo queda la tarjeta informativa */}
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
                const usuario_id = getOrCreateLocalUserId();
                const payload = {
                  usuario_id,
                  sistolica: parseInt(data.systolic, 10),
                  diastolica: parseInt(data.diastolic, 10),
                  pulso_bpm: parseInt(data.pulse, 10),
                  source: 'manual',
                  ts: data.ts ? new Date(data.ts).toISOString() : new Date().toISOString(),
                  // Puedes agregar brazo/postura si tu formulario los tiene
                };
                const { error } = await supabase.from('mediciones').insert([payload]);
                if (error) alert('Error al guardar: ' + error.message);
                else alert('¡Medición de presión guardada!');
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
                const usuario_id = getOrCreateLocalUserId();
                const payload = {
                  usuario_id,
                  glucosa_mg_dl: parseFloat(data.glucose),
                  source: 'manual',
                  ts: data.ts ? new Date(data.ts).toISOString() : new Date().toISOString(),
                  notas: data.condicion || null,
                };
                const { error } = await supabase.from('glucosa').insert([payload]);
                if (error) alert('Error al guardar: ' + error.message);
                else alert('¡Medición de glucosa guardada!');
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
                const usuario_id = getOrCreateLocalUserId();
                const payload = {
                  usuario_id,
                  spo2: parseFloat(data.spo2),
                  pulso_bpm: data.pulse ? parseInt(data.pulse, 10) : null,
                  source: 'manual',
                  ts: data.ts ? new Date(data.ts).toISOString() : new Date().toISOString(),
                };
                const { error } = await supabase.from('mediciones').insert([payload]);
                if (error) alert('Error al guardar: ' + error.message);
                else alert('¡Medición de SpO₂ guardada!');
              }}
            />
          )}
        </div>
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
  );
}

