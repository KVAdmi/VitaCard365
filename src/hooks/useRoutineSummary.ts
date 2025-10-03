import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

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
        // Cargar último plan del usuario
        if (user?.id) {
          const { data, error } = await supabase
            .from('planes')
            .select('dias_semana')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!error && data?.dias_semana) setDiasSemana(Number(data.dias_semana) || 0);
        }

        // Fallback/local storage para progreso semanal y streak
        try {
          const raw = localStorage.getItem(LS_SUMMARY);
          if (raw) {
            const obj = JSON.parse(raw);
            if (typeof obj.sesionesSemana === 'number') setSesionesSemana(obj.sesionesSemana);
            if (typeof obj.streakDias === 'number') setStreakDias(obj.streakDias);
            if (typeof obj.kcalHoy === 'number') setKcalHoy(obj.kcalHoy);
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [user?.id]);

  return { streakDias, sesionesSemana, diasSemana, kcalHoy, loading };
}
