import { loadSleep } from './storage';

function toDate(ts:number) {
  return new Date(ts).toLocaleDateString();
}

export default function SleepHistory() {
  const rows = loadSleep();
  
  if (!rows.length) return <p className="opacity-60">Sin sesiones registradas.</p>;
  
  return (
    <div className="space-y-2">
      {rows.map(s=>(
        <div key={s.id} className="border rounded-lg p-3 flex justify-between">
          <div>
            <div className="text-sm opacity-70">{toDate(s.startTs)} → {toDate(s.endTs)}</div>
            <div className="text-sm">Duración: {(s.durationMin/60).toFixed(2)} h</div>
          </div>
          {s.score!=null && <div className="text-sm">Score: {s.score}</div>}
        </div>
      ))}
    </div>
  );
}