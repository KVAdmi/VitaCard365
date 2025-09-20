
import React, { useEffect, useState } from "react";
import { generateVitalsPDF } from "../../lib/generateVitalsPDF";
import { fetchUserChartsData } from "../../lib/fetchUserChartsData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuth } from "../../contexts/AuthContext";

function HistoryCard({ title, subtitle, children, onDownloadPDF }) {
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
        <button
          onClick={onDownloadPDF}
          style={{
            background: "#ED6A48",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Descargar PDF
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        {children}
      </div>
    </div>
  );
}

export default function NASAHistoryCardsPanel() {
  const { user } = useAuth();
  const [mediciones, setMediciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetchUserChartsData(user.id).then((res) => {
      setMediciones(res.mediciones || []);
      setLoading(false);
    });
  }, [user]);

  // Formatear datos para la gráfica de presión arterial
  const bpData = mediciones
    .filter(m => m.sistolica && m.diastolica)
    .map(m => ({
      fecha: new Date(m.ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
      sistolica: m.sistolica,
      diastolica: m.diastolica,
      pulso: m.pulso_bpm
    }));

  const onPdfPresion = () =>
    generateVitalsPDF({
      title: "Presión Arterial",
      headers: ["FECHA MEDICIÓN", "SISTÓLICA", "DIASTÓLICA", "PULSO"],
      rows: bpData,
      user,
    });

  return (
    <div>
      <HistoryCard
        title="Presión arterial"
        subtitle="Últimos 7 días"
        onDownloadPDF={onPdfPresion}
      >
        <div style={{ height: 200, width: '100%' }}>
          {loading ? (
            <div style={{color:'#fff',textAlign:'center',paddingTop:60}}>Cargando...</div>
          ) : bpData.length === 0 ? (
            <div style={{color:'#fff',textAlign:'center',paddingTop:60}}>Sin datos</div>
          ) : (
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
          )}
        </div>
      </HistoryCard>

      {/* El resto de tarjetas se llenarán después de validar este ejemplo visual */}
      <HistoryCard title="Glucosa" subtitle="Últimos 7 días" onDownloadPDF={()=>{}}>
        <div style={{ height: 160, background: "rgba(255,255,255,0.06)", borderRadius: 8, display:'flex',alignItems:'center',justifyContent:'center',color:'#fff' }}>
          Próximamente gráfica real...
        </div>
      </HistoryCard>
      <HistoryCard title="SpO₂" subtitle="Últimos 7 días" onDownloadPDF={()=>{}}>
        <div style={{ height: 160, background: "rgba(255,255,255,0.06)", borderRadius: 8, display:'flex',alignItems:'center',justifyContent:'center',color:'#fff' }}>
          Próximamente gráfica real...
        </div>
      </HistoryCard>
      <HistoryCard title="Frecuencia cardíaca" subtitle="Últimos 7 días" onDownloadPDF={()=>{}}>
        <div style={{ height: 160, background: "rgba(255,255,255,0.06)", borderRadius: 8, display:'flex',alignItems:'center',justifyContent:'center',color:'#fff' }}>
          Próximamente gráfica real...
        </div>
      </HistoryCard>
      <HistoryCard title="Temperatura" subtitle="Últimos 7 días" onDownloadPDF={()=>{}}>
        <div style={{ height: 160, background: "rgba(255,255,255,0.06)", borderRadius: 8, display:'flex',alignItems:'center',justifyContent:'center',color:'#fff' }}>
          Próximamente gráfica real...
        </div>
      </HistoryCard>
      <HistoryCard title="Peso" subtitle="Últimos 7 días" onDownloadPDF={()=>{}}>
        <div style={{ height: 160, background: "rgba(255,255,255,0.06)", borderRadius: 8, display:'flex',alignItems:'center',justifyContent:'center',color:'#fff' }}>
          Próximamente gráfica real...
        </div>
      </HistoryCard>
    </div>
  );
}
