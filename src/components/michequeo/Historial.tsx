import React from 'react';
import { loadMediciones } from '../../lib/storage';

export default function Historial() {
  const list = loadMediciones();
  
  if (!list.length) {
    return <p className="text-white/60">Sin registros aún.</p>;
  }
  
  return (
    <div className="space-y-2">
      {list.map(r => (
        <div key={r.id} className="border border-white/10 rounded-lg p-3 flex items-center justify-between bg-white/5">
          <div>
            <div className="text-sm text-white/70">{new Date(r.ts).toLocaleString()} • {r.source.toUpperCase()}</div>
            <div className="text-sm text-white">
              {r.pesoKg ? `Peso: ${r.pesoKg} kg ` : ''}
              {r.sistolica && r.diastolica ? ` · TA: ${r.sistolica}/${r.diastolica} mmHg ` : ''}
              {r.pulsoBpm ? ` · Pulso: ${r.pulsoBpm} bpm` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}