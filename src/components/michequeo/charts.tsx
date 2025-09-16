import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { loadMediciones } from '../lib/storage';
import { useMemo } from 'react';

function useData() {
  const raw = loadMediciones();
  // normaliza para gráficos (orden ascendente por ts)
  return useMemo(() => [...raw].sort((a,b)=>a.ts-b.ts).map(r => ({
    ts: new Date(r.ts).toLocaleString(),
    pesoKg: r.pesoKg ?? null,
    sistolica: r.sistolica ?? null,
    diastolica: r.diastolica ?? null,
    pulsoBpm: r.pulsoBpm ?? null,
  })), [raw]);
}

export function PesoChart() {
  const data = useData();
  return (
    <div className="card border border-white/10 p-4">
      <h3 className="text-white font-semibold mb-2">Evolución de Peso (kg)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="ts" hide />
          <YAxis domain={['dataMin-2','dataMax+2']} unit=" kg" stroke="#fff" />
          <Tooltip contentStyle={{ backgroundColor: '#0c1c3e', border: '1px solid rgba(255,255,255,0.1)' }} />
          <Line type="monotone" dataKey="pesoKg" stroke="#4ade80" dot strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VitalesChart() {
  const data = useData();
  return (
    <div className="card border border-white/10 p-4">
      <h3 className="text-white font-semibold mb-2">Signos Vitales</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="ts" hide />
          <YAxis yAxisId="bp" domain={[40, 200]} stroke="#fff" />
          <YAxis yAxisId="hr" orientation="right" domain={[40, 190]} stroke="#fff" />
          <Tooltip contentStyle={{ backgroundColor: '#0c1c3e', border: '1px solid rgba(255,255,255,0.1)' }} />
          <Legend />
          <Line yAxisId="bp" type="monotone" dataKey="sistolica" name="Sistólica (mmHg)" stroke="#f87171" dot={false} strokeWidth={2}/>
          <Line yAxisId="bp" type="monotone" dataKey="diastolica" name="Diastólica (mmHg)" stroke="#fb923c" dot={false} strokeWidth={2}/>
          <Line yAxisId="hr" type="monotone" dataKey="pulsoBpm" name="Pulso (BPM)" stroke="#f472b6" dot={false} strokeWidth={2}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}