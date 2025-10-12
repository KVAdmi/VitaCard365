// src/features/rutinas/ReminderPanel.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useWorkoutReminders } from '@/hooks/useWorkoutReminders';
import { createAgendaEvent } from '@/lib/agenda';

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
  const [perDay, setPerDay] = useState(false);
  const [horaPorDia, setHoraPorDia] = useState<Record<number,string>>(()=>{
    const init: Record<number,string> = {};
    for (const d of defaultDays) init[d] = defaultTime;
    return init;
  });
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth()+1).padStart(2,'0');
    const d = String(today.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  });

  useEffect(()=>{ setHora(defaultTime); },[defaultTime]);
  useEffect(()=>{ setDias(defaultDays); setHoraPorDia(prev=>{
    const next: Record<number,string> = { ...prev };
    for (const d of defaultDays) if (!next[d]) next[d] = defaultTime;
    return next;
  }); },[defaultDays, defaultTime]);

  function toggleDia(d: number) {
    setDias(prev => {
      const exists = prev.includes(d);
      const out = exists ? prev.filter(x=>x!==d) : [...prev, d];
      if (!exists) {
        setHoraPorDia(map => ({ ...map, [d]: map[d] ?? hora }));
      }
      return out;
    });
  }

  async function onHabilitar() {
  const [h, m] = hora.split(':').map(n => parseInt(n, 10));
  // Asegura permisos/estado, pero sin programar duplicados aquí
  await habilitar({ hora: h, minuto: m, dias: [] });
    // Crear eventos en Agenda: uno por cada día seleccionado en la semana de inicio
    try {
      // Calcula la primera fecha de cada día seleccionado a partir de startDate
      const [yy,mm,dd] = startDate.split('-').map(Number);
      const base = new Date(yy, (mm-1), dd, 0, 0, 0, 0);
      // JS: 0=Dom .. 6=Sáb; Capacitor: 1=Dom..7=Sáb
      const baseDowCap = (base.getDay()+1); // 1..7
      // Por cada día seleccionado, encuentra la fecha local de esa semana
      for (const dSel of dias.sort((a,b)=>a-b)) {
        const diff = ((dSel - baseDowCap) + 7) % 7; // días a sumar
        const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + diff);
        const event_date = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
        const timeStr = perDay ? (horaPorDia[dSel] || hora) : hora;
        const [hh,mm] = timeStr.split(':').map(x=>parseInt(x,10));
        const event_time = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`;
        await createAgendaEvent({
          type: 'otro',
          title: 'Entrenamiento de rutina',
          description: 'Sesión programada de tu plan',
          event_date,
          event_time,
          notify: true,
          repeat_type: 'weekly',
          repeat_until: null,
        });
      }
    } catch {}
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
        <label className="text-sm">
          <div className="opacity-70 mb-1">Fecha de inicio</div>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
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

      <div className="mt-2 flex items-center gap-2 text-sm">
        <input id="perDay" type="checkbox" checked={perDay} onChange={e=>setPerDay(e.target.checked)} />
        <label htmlFor="perDay">Elegir una hora distinta por día</label>
      </div>

      {perDay && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {dias.sort((a,b)=>a-b).map(dSel => (
            <label key={dSel} className="text-xs">
              <div className="opacity-70 mb-1">{['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][dSel-1]}</div>
              <input type="time" value={horaPorDia[dSel] || hora} onChange={e=>setHoraPorDia(map=>({...map, [dSel]: e.target.value}))}
                className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--vc-primary,#f06340)] focus:border-[color:var(--vc-primary,#f06340)]"/>
            </label>
          ))}
        </div>
      )}

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
