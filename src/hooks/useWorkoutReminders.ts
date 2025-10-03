// src/hooks/useWorkoutReminders.ts
import { useCallback, useState } from 'react';
import {
  asegurarPermisoNotificaciones,
  asegurarCanalFitness,
  programarSemanales,
  cancelarTodasLasNotificaciones,
  DIA_SEMANA,
} from '@/lib/notifications';

type HabilitarOpts = {
  hora: number;           // 0..23
  minuto: number;         // 0..59
  dias: number[];         // 1..7 (Capacitor)
  titulo?: string;
  cuerpo?: string;
};

export function useWorkoutReminders() {
  const [habilitadas, setHabilitadas] = useState(false);

  const habilitar = useCallback(async (opts: HabilitarOpts) => {
    const ok = await asegurarPermisoNotificaciones();
    if (!ok) throw new Error('Permiso de notificaciones denegado.');
    await asegurarCanalFitness();

    await programarSemanales({
      idBase: 32000,
      titulo: opts.titulo ?? 'Hora de entrenar 💪',
      cuerpo: opts.cuerpo ?? 'Tu rutina te espera.',
      hora: opts.hora,
      minuto: opts.minuto,
      diasSemana: opts.dias,
    });

    setHabilitadas(true);
  }, []);

  const deshabilitar = useCallback(async () => {
    await cancelarTodasLasNotificaciones();
    setHabilitadas(false);
  }, []);

  return { habilitadas, habilitar, deshabilitar, DIA_SEMANA };
}
