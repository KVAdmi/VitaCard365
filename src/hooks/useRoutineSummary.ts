import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { dateKeyMX, lastNDaysKeysMX } from '@/lib/tz';

type Summary = {
  streakDias: number;
  sesionesSemana: number;
  diasSemana: number;
  kcalHoy: number;
  loading: boolean;
};

const LS_SUMMARY = 'vc.routine.summary';

export function useRoutineSummary(): Summary {
  const { user } = useAuth();
  const [streakDias, setStreakDias] = useState(0);
  const [sesionesSemana, setSesionesSemana] = useState(0);
  const [diasSemana, setDiasSemana] = useState(0);
  const [kcalHoy, setKcalHoy] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        if (!user?.id) return;

        // Último plan para objetivo semanal
        const { data: planRow } = await supabase
          .from('planes')
          .select('dias_semana')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (planRow?.dias_semana) setDiasSemana(Number(planRow.dias_semana) || 0);

        // Resumen últimos 7 días desde workouts
        const hoy = new Date();
        const keys7 = lastNDaysKeysMX(7, hoy);
        const desde = new Date(hoy); desde.setDate(hoy.getDate()-6);
        const { data } = await supabase
          .from('workouts')
          .select('ts_inicio,minutos,kcal')
          .eq('user_id', user.id)
          .gte('ts_inicio', desde.toISOString())
          .lte('ts_inicio', hoy.toISOString());

        const indexByKey = new Map(keys7.map((k,i)=>[k,i]));
        const bucket = new Array(7).fill(0).map(()=>({min:0,kcal:0}));
        (data||[]).forEach(w => {
          const k = dateKeyMX(new Date(w.ts_inicio as string));
          const idx = indexByKey.get(k);
          if (idx != null) { bucket[idx].min += (w.minutos as number) || 0; bucket[idx].kcal += (w.kcal as number) || 0; }
        });

        setKcalHoy(bucket[6]?.kcal || 0);
        setSesionesSemana(bucket.reduce((acc,b)=> acc + ((b.min||0)>0 ? 1 : 0), 0));
        let streak = 0; for (let i=6;i>=0;i--){ if ((bucket[i]?.min||0)>0) streak++; else break; }
        setStreakDias(streak);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [user?.id]);

  return { streakDias, sesionesSemana, diasSemana, kcalHoy, loading };
}
