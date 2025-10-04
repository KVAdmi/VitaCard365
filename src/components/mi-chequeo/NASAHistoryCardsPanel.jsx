
import React, { useEffect, useState } from "react";
import { generateVitalsPDF } from "../../lib/generateVitalsPDF";
import { fetchUserChartsData } from "../../lib/fetchUserChartsData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuth } from "../../contexts/AuthContext";

function HistoryCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: "#0C1C3A",
      borderRadius: 12,
      padding: 16,
      color: "#fff",
      marginBottom: 16,
      boxShadow: "0 6px 18px rgba(0,0,0,0.15)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: 0.5 }}>{title}</h3>
          {subtitle && <small style={{ opacity: 0.8 }}>{subtitle}</small>}
        </div>
        {/* Botón 'Descargar PDF' removido por solicitud */}
      </div>
      <div style={{ marginTop: 12 }}>
        {children}
      </div>
    </div>
  );
}

export default function NASAHistoryCardsPanel() {

  // DEMO: Datos dummy para demo rápida
  const [loading, setLoading] = useState(false);
  const [mediciones, setMediciones] = useState([
    // 7 días de presión arterial, pulso, SpO2, temperatura, peso
    ...Array.from({length:7}).map((_,i) => {
      const d = new Date(); d.setDate(d.getDate()-i);
      return {
        ts: d.toISOString(),
        sistolica: 110+Math.floor(Math.random()*20),
        diastolica: 70+Math.floor(Math.random()*10),
        pulso_bpm: 65+Math.floor(Math.random()*15),
        spo2: 95+Math.floor(Math.random()*4),
        temperatura: 36+Math.random(),
        peso: 70+Math.random()*2-1,
      };
    })
  ]);

  // Formatear datos para las gráficas
  const bpData = mediciones.map(m => ({
    fecha: new Date(m.ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
    sistolica: m.sistolica,
    diastolica: m.diastolica,
    pulso: m.pulso_bpm
  }));

  const glucosaData = mediciones.map(m => ({
    fecha: new Date(m.ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
    glucosa: 80+Math.floor(Math.random()*40)
  }));

  const spo2Data = mediciones.map(m => ({
    fecha: new Date(m.ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
    spo2: m.spo2
  }));

  const hrData = mediciones.map(m => ({
    fecha: new Date(m.ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
    pulso: m.pulso_bpm
  }));

  const tempData = mediciones.map(m => ({
    fecha: new Date(m.ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
    temperatura: m.temperatura
  }));

  const pesoData = mediciones.map(m => ({
    fecha: new Date(m.ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
    peso: m.peso
  }));

  // Generación de PDF deshabilitada según solicitud

  return (
    <div>
      <HistoryCard
        title="Presión arterial"
        subtitle="Últimos 7 días"
      >
        <div style={{ height: 200, width: '100%' }}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={bpData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23325b" />
              <XAxis dataKey="fecha" stroke="#fff" fontSize={12} tick={{ fill: '#fff' }} />
              <YAxis yAxisId="left" stroke="#f06340" fontSize={12} tick={{ fill: '#f06340' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#60a5fa" fontSize={12} tick={{ fill: '#60a5fa' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: 'none', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Line yAxisId="left" type="monotone" dataKey="sistolica" stroke="#f06340" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={900} name="Sistólica" />
              <Line yAxisId="left" type="monotone" dataKey="diastolica" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={900} name="Diastólica" />
              <Line yAxisId="right" type="monotone" dataKey="pulso" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} animationDuration={900} name="Pulso" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </HistoryCard>

  <HistoryCard title="Glucosa" subtitle="Últimos 7 días">
        <div style={{ height: 180, width: '100%' }}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={glucosaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23325b" />
              <XAxis dataKey="fecha" stroke="#fff" fontSize={12} tick={{ fill: '#fff' }} />
              <YAxis stroke="#f06340" fontSize={12} tick={{ fill: '#f06340' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: 'none', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="glucosa" stroke="#f06340" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={900} name="Glucosa" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </HistoryCard>
  <HistoryCard title="SpO₂" subtitle="Últimos 7 días">
        <div style={{ height: 180, width: '100%' }}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={spo2Data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23325b" />
              <XAxis dataKey="fecha" stroke="#fff" fontSize={12} tick={{ fill: '#fff' }} />
              <YAxis stroke="#60a5fa" fontSize={12} tick={{ fill: '#60a5fa' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: 'none', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="spo2" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={900} name="SpO₂" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </HistoryCard>
  <HistoryCard title="Frecuencia cardíaca" subtitle="Últimos 7 días">
        <div style={{ height: 180, width: '100%' }}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={hrData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23325b" />
              <XAxis dataKey="fecha" stroke="#fff" fontSize={12} tick={{ fill: '#fff' }} />
              <YAxis stroke="#fbbf24" fontSize={12} tick={{ fill: '#fbbf24' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: 'none', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="pulso" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={900} name="Pulso" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </HistoryCard>
  <HistoryCard title="Temperatura" subtitle="Últimos 7 días">
        <div style={{ height: 180, width: '100%' }}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={tempData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23325b" />
              <XAxis dataKey="fecha" stroke="#fff" fontSize={12} tick={{ fill: '#fff' }} />
              <YAxis stroke="#f87171" fontSize={12} tick={{ fill: '#f87171' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: 'none', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="temperatura" stroke="#f87171" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={900} name="Temperatura" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </HistoryCard>
  <HistoryCard title="Peso" subtitle="Últimos 7 días">
        <div style={{ height: 180, width: '100%' }}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={pesoData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23325b" />
              <XAxis dataKey="fecha" stroke="#fff" fontSize={12} tick={{ fill: '#fff' }} />
              <YAxis stroke="#4ade80" fontSize={12} tick={{ fill: '#4ade80' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: 'none', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="peso" stroke="#4ade80" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={900} name="Peso" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </HistoryCard>
    </div>
  );
}
