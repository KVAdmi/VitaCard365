import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import MeasureLayout from '../../components/michequeo/MeasureLayout';
import { Card } from '../../components/ui/card';


const History = () => {
  const { user } = useAuth();
  const [medidas, setMedidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('all');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  useEffect(() => {
    const fetchMedidas = async () => {
      let query = supabase
        .from('vital_signs')
        .select('*')
        .eq('user_uuid', user.id)
        .order('ts', { ascending: false });
      if (tipo !== 'all') query = query.eq('type', tipo);
      if (desde) query = query.gte('ts', desde);
      if (hasta) query = query.lte('ts', hasta);
      const { data, error } = await query;
      if (!error) setMedidas(data || []);
      setLoading(false);
    };
    fetchMedidas();
  }, [user.id, tipo, desde, hasta]);


  // Diagnóstico simple
  function diagnostico(m) {
    if (m.type === 'bp') {
      if (m.value >= 180 || m.extra?.systolic >= 180) return { nivel: 'ALERTA', color: '#f06340', texto: 'Presión muy alta. Busca atención médica inmediata.' };
      if (m.value <= 90 || m.extra?.systolic <= 90) return { nivel: 'ALERTA', color: '#f06340', texto: 'Presión baja. Consulta a tu médico.' };
      return { nivel: 'OK', color: '#4ade80', texto: 'Presión dentro de rango aceptable.' };
    }
    if (m.type === 'pulso_bpm') {
      if (m.value > 120) return { nivel: 'ALERTA', color: '#f06340', texto: 'Pulso elevado. Descansa y consulta si persiste.' };
      if (m.value < 50) return { nivel: 'ALERTA', color: '#f06340', texto: 'Pulso bajo. Consulta a tu médico.' };
      return { nivel: 'OK', color: '#4ade80', texto: 'Pulso normal.' };
    }
    if (m.type === 'spo2') {
      if (m.value < 90) return { nivel: 'ALERTA', color: '#f06340', texto: 'SpO₂ bajo. Busca atención médica.' };
      return { nivel: 'OK', color: '#4ade80', texto: 'SpO₂ normal.' };
    }
    if (m.type === 'glucosa') {
      if (m.value > 180) return { nivel: 'ALERTA', color: '#f06340', texto: 'Glucosa alta. Consulta a tu médico.' };
      if (m.value < 70) return { nivel: 'ALERTA', color: '#f06340', texto: 'Glucosa baja. Come algo y consulta.' };
      return { nivel: 'OK', color: '#4ade80', texto: 'Glucosa normal.' };
    }
    return { nivel: '', color: '', texto: '' };
  }

  // Descargar PDF (placeholder)
  function descargarPDF(m) {
    alert('Descarga PDF no implementada aún. Medida: ' + JSON.stringify(m));
  }

  return (
    <MeasureLayout
      title="Historial de Signos Vitales"
      subtitle="Consulta y descarga tus mediciones"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 mb-2">
          <select value={tipo} onChange={e=>setTipo(e.target.value)} className="rounded-lg px-3 py-2 bg-white/10 text-white">
            <option value="all">Todos</option>
            <option value="bp">Presión arterial</option>
            <option value="pulso_bpm">Pulso</option>
            <option value="spo2">SpO₂</option>
            <option value="glucosa">Glucosa</option>
          </select>
          <input type="date" value={desde} onChange={e=>setDesde(e.target.value)} className="rounded-lg px-3 py-2 bg-white/10 text-white" />
          <input type="date" value={hasta} onChange={e=>setHasta(e.target.value)} className="rounded-lg px-3 py-2 bg-white/10 text-white" />
        </div>
        {loading ? (
          <Card className="p-6 glass-card">
            <p className="text-center text-white/70">Cargando mediciones...</p>
          </Card>
        ) : medidas.length === 0 ? (
          <Card className="p-6 glass-card">
            <p className="text-center text-white/70">No hay mediciones registradas aún.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {medidas.map((m) => {
              const diag = diagnostico(m);
              return (
                <div key={m.id} className="glass-card p-4 rounded-2xl shadow-xl border border-white/20">
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>{new Date(m.ts).toLocaleDateString()} {new Date(m.ts).toLocaleTimeString()}</span>
                    <span>{m.unit}</span>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="text-2xl font-bold text-white">
                      {m.type === 'bp' && m.extra ? `${m.extra.systolic}/${m.extra.diastolic}` : m.value}
                      {m.type === 'spo2' && '%'}
                    </div>
                    <div className="text-xs px-2 py-1 rounded-lg" style={{background:diag.color+'22',color:diag.color}}>{diag.nivel}</div>
                  </div>
                  <div className="text-sm text-white/80 mb-1">{diag.texto}</div>
                  <div className="text-xs text-white/60 mb-1">Fuente: {m.source}</div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={()=>descargarPDF(m)} className="rounded-lg px-3 py-1 bg-[#f06340] text-white text-xs font-bold">Descargar PDF</button>
                  </div>
                  <div className="text-xs text-white/40 mt-2">Este reporte es solo informativo, no es diagnóstico médico. Si tienes síntomas graves, busca atención profesional.</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MeasureLayout>
  );
};

export default History;