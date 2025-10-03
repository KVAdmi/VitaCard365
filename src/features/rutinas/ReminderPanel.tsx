// src/features/rutinas/ReminderPanel.tsx
import React, { useEffect, useState } from 'react';
import { useWorkoutReminders } from '@/hooks/useWorkoutReminders';

const Card: React.FC<React.PropsWithChildren<{className?: string}>> = ({ className='', children }) => (
  <div className={`rounded-2xl shadow-lg backdrop-blur-md bg-[color:var(--vc-card,rgba(20,20,28,0.7))]/80 border border-white/10 ${className}`}>
    {children}
  </div>
);

type Props = {
  defaultTime?: string;   // "HH:MM", ej "07:00"
  defaultDays?: number[]; // 1..7 (Capacitor: 1=Dom ... 7=Sáb)
  compact?: boolean;      // para modal
  onActivated?: () => void;
};

export default function ReminderPanel({ defaultTime='07:00', defaultDays=[2,4,6], compact=false, onActivated }: Props) {
  const { habilitadas, habilitar, deshabilitar, DIA_SEMANA } = useWorkoutReminders();
  const [hora, setHora] = useState(defaultTime);
  const [dias, setDias] = useState<number[]>(defaultDays);

  useEffect(()=>{ setHora(defaultTime); },[defaultTime]);
  useEffect(()=>{ setDias(defaultDays); },[defaultDays]);

  function toggleDia(d: number) {
    setDias(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d]);
  }

  async function onHabilitar() {
    const [h, m] = hora.split(':').map(n => parseInt(n, 10));
    await habilitar({ hora: h, minuto: m, dias });
    if (onActivated) onActivated();
  }

  const content = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <div className="opacity-70 mb-1">Hora</div>
     <input type="time" value={hora} onChange={e=>setHora(e.target.value)}
       className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--vc-primary,#f06340)] focus:border-[color:var(--vc-primary,#f06340)]"/>
        </label>
        <div>
          <div className="opacity-70 mb-1 text-sm">Días</div>
          <div className="flex flex-wrap gap-2">
            {[
              {d:DIA_SEMANA.LUN,label:'Lun'},
              {d:DIA_SEMANA.MAR,label:'Mar'},
              {d:DIA_SEMANA.MIE,label:'Mié'},
              {d:DIA_SEMANA.JUE,label:'Jue'},
              {d:DIA_SEMANA.VIE,label:'Vie'},
              {d:DIA_SEMANA.SAB,label:'Sáb'},
              {d:DIA_SEMANA.DOM,label:'Dom'},
            ].map(({d,label})=> (
              <button key={d}
                onClick={()=>toggleDia(d)}
                className={`px-3 py-1 rounded-full border transition-colors ${dias.includes(d)?'border-[color:var(--vc-primary,#f06340)] bg-[color:var(--vc-primary,#f06340)]/15 text-white':'border-white/10 hover:border-[color:var(--vc-primary,#f06340)]/60'} bg-black/20 text-xs`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={onHabilitar}
          className="flex-1 py-3 rounded-2xl font-semibold bg-[color:var(--vc-primary,#f06340)]/90 text-white">
          Activar recordatorios
        </button>
        {habilitadas ? (
          <button onClick={deshabilitar} className="px-3 py-3 rounded-2xl bg-white/10">Desactivar</button>
        ) : null}
      </div>

      <p className="text-xs opacity-70 mt-2">Programamos notificaciones locales recurrentes; no requieren internet.</p>
    </>
  );

  if (compact) {
    return <div className="space-y-3">{content}</div>;
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recordatorios</h3>
        {habilitadas ? <button onClick={deshabilitar} className="px-3 py-1 rounded-xl bg-white/10">Desactivar</button> : null}
      </div>
      {content}
    </Card>
  );
}
