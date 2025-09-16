import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { loadSleep } from './storage';

export default function SleepChart() {
  const data = [...loadSleep()]
    .sort((a,b)=>a.startTs-b.startTs)
    .map(s=>({
      day: new Date(s.startTs).toLocaleDateString(undefined,{ month:'short', day:'2-digit' }),
      hours: +(s.durationMin/60).toFixed(2)
    }));

  return (
    <div className="card p-4">
      <h3 className="font-semibold mb-2">Sueño (horas por noche)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis domain={[0, 12]} />
          <Tooltip />
          <ReferenceLine y={8} strokeDasharray="4 4" label="Objetivo 8h" />
          <Bar dataKey="hours" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}