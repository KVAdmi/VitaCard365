
import React, { useEffect, useState } from "react";
import { generateVitalsPDF } from "../../lib/generateVitalsPDF";
import { fetchUserChartsData } from "../../lib/fetchUserChartsData";
import { supabase } from "../../lib/supabaseClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuth } from "../../contexts/AuthContext";

function HistoryCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: "#0C1C3A",
      borderRadius: 12,
      padding: 12,
      color: "#fff",
      marginBottom: 12,
      boxShadow: "0 6px 18px rgba(0,0,0,0.15)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: 0.5 }}>{title}</h3>
          {subtitle && <small style={{ opacity: 0.8 }}>{subtitle}</small>}
        </div>
        {/* Botón 'Descargar PDF' removido por solicitud */}
      </div>
      <div style={{ marginTop: 8 }}>
        {children}
      </div>
    </div>
  );
}

export default function NASAHistoryCardsPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mediciones, setMediciones] = useState([]);

  // Cargar datos reales de Supabase (últimos 7 días)
  useEffect(() => {
    (async () => {
      try {
        if (!user?.id) return;
        setLoading(true);
        const since = new Date();
        since.setDate(since.getDate() - 6); // incluye hoy
        since.setHours(0,0,0,0);
        const { data, error } = await supabase
          .from('mediciones')
          .select('*')
          .eq('usuario_id', user.id)
          .gte('ts', since.toISOString())
          .order('ts', { ascending: true });
        if (!error) setMediciones(data || []);
      } catch (e) {
        // opcional: log
        console.warn('No se pudieron cargar mediciones:', e?.message || e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  // Formatear datos para las gráficas
  const bpData = mediciones
    .filter(m => m.sistolica != null || m.diastolica != null || m.pulso_bpm != null)
    .map(m => ({
      fecha: new Date(m.ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
      sistolica: m.sistolica ?? null,
      diastolica: m.diastolica ?? null,
      pulso: m.pulso_bpm ?? null,
    }));

  // Glucosa: derivar de mediciones tipo 'glucosa' si existe en notas
  const glucosaData = mediciones
    .filter(m => m.tipo === 'glucosa' && m.notas)
    .map(m => {
      const match = String(m.notas).match(/glucosa\s*=\s*([0-9]+\.?[0-9]*)/i);
      const valor = match ? parseFloat(match[1]) : null;
      return {
        fecha: new Date(m.ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
        glucosa: valor,
      };
    })
    .filter(d => d.glucosa != null);

  const spo2Data = mediciones
    .filter(m => m.spo2 != null)
    .map(m => ({
      fecha: new Date(m.ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
      spo2: m.spo2
    }));

  const hrData = mediciones
    .filter(m => m.pulso_bpm != null)
    .map(m => ({
      fecha: new Date(m.ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
      pulso: m.pulso_bpm
    }));

  const pesoData = mediciones
    .filter(m => m.tipo === 'peso' && (m.peso_kg != null || m.peso != null))
    .map(m => ({
      fecha: new Date(m.ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
      peso: m.peso_kg ?? m.peso
    }));

  // Generación de PDF deshabilitada según solicitud

  return (
    <div>
      <HistoryCard
        title="Presión arterial"
        subtitle="Últimos 7 días"
      >
        <div style={{ height: 220, width: '100%' }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bpData} margin={{ top: 12, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23325b" />
              <XAxis dataKey="fecha" stroke="#fff" fontSize={12} tick={{ fill: '#fff' }} />
              <YAxis yAxisId="left" stroke="#f06340" fontSize={12} tick={{ fill: '#f06340' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#60a5fa" fontSize={12} tick={{ fill: '#60a5fa' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: 'none', color: '#fff' }} />
              <Legend verticalAlign="top" height={24} wrapperStyle={{ color: '#fff' }} />
              <Line yAxisId="left" type="monotone" dataKey="sistolica" stroke="#f06340" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={900} name="Sistólica" />
              <Line yAxisId="left" type="monotone" dataKey="diastolica" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={900} name="Diastólica" />
              <Line yAxisId="right" type="monotone" dataKey="pulso" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} animationDuration={900} name="Pulso" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </HistoryCard>

  <HistoryCard title="Glucosa" subtitle="Últimos 7 días">
        <div style={{ height: 220, width: '100%' }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={glucosaData} margin={{ top: 12, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23325b" />
              <XAxis dataKey="fecha" stroke="#fff" fontSize={12} tick={{ fill: '#fff' }} />
              <YAxis stroke="#f06340" fontSize={12} tick={{ fill: '#f06340' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: 'none', color: '#fff' }} />
              <Legend verticalAlign="top" height={24} wrapperStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="glucosa" stroke="#f06340" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={900} name="Glucosa" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </HistoryCard>
  <HistoryCard title="SpO₂" subtitle="Últimos 7 días">
        <div style={{ height: 220, width: '100%' }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={spo2Data} margin={{ top: 12, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23325b" />
              <XAxis dataKey="fecha" stroke="#fff" fontSize={12} tick={{ fill: '#fff' }} />
              <YAxis stroke="#60a5fa" fontSize={12} tick={{ fill: '#60a5fa' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: 'none', color: '#fff' }} />
              <Legend verticalAlign="top" height={24} wrapperStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="spo2" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={900} name="SpO₂" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </HistoryCard>
  <HistoryCard title="Frecuencia cardíaca" subtitle="Últimos 7 días">
        <div style={{ height: 220, width: '100%' }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hrData} margin={{ top: 12, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23325b" />
              <XAxis dataKey="fecha" stroke="#fff" fontSize={12} tick={{ fill: '#fff' }} />
              <YAxis stroke="#fbbf24" fontSize={12} tick={{ fill: '#fbbf24' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: 'none', color: '#fff' }} />
              <Legend verticalAlign="top" height={24} wrapperStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="pulso" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={900} name="Pulso" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </HistoryCard>
  <HistoryCard title="Peso" subtitle="Últimos 7 días">
        <div style={{ height: 220, width: '100%' }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={pesoData} margin={{ top: 12, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23325b" />
              <XAxis dataKey="fecha" stroke="#fff" fontSize={12} tick={{ fill: '#fff' }} />
              <YAxis stroke="#4ade80" fontSize={12} tick={{ fill: '#4ade80' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: 'none', color: '#fff' }} />
              <Legend verticalAlign="top" height={24} wrapperStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="peso" stroke="#4ade80" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={900} name="Peso" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </HistoryCard>
    </div>
  );
}
