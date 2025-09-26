// src/components/rutina/EjercicioCard.tsx
import { useState } from 'react';
import { CAT_COLORS, Categoria } from '../../lib/categories';

type Props = {
  nombre: string;
  categoria: Categoria;
  series: number;
  reps: number | null;
  tiempo_seg: number | null;
  descanso_seg: number;
  cues: string[];
  equipo: string[];
  contraindicaciones: string[];
  imagen_url?: string | null;
  completed?: boolean;
};

export default function EjercicioCard({
  nombre, categoria, series, reps, tiempo_seg, descanso_seg,
  cues = [], equipo = [], contraindicaciones = [], imagen_url, completed
}: Props) {
  const [open, setOpen] = useState(false);
  const cls = CAT_COLORS[categoria];

  return (
    <div
      role="listitem"
      tabIndex={-1}
      aria-label={`Ejercicio: ${nombre}`}
      className={`group p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 transition-transform hover:scale-[1.01] hover:shadow-xl ${cls.ring} ${completed ? 'opacity-60 pointer-events-none' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg md:text-xl font-semibold text-[#E6EAF2]">{nombre}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${cls.bg} ${cls.text} border border-white/10`}>
              {categoria}
            </span>
          </div>

          <div className="mt-2 text-sm text-[#E6EAF2]/80">
            {tiempo_seg
              ? (<span><strong>{series} x {tiempo_seg}s</strong> · descanso {descanso_seg}s</span>)
              : (<span><strong>{series} x {reps ?? 0} reps</strong> · descanso {descanso_seg}s</span>)
            }
          </div>

          {cues?.length > 0 && (
            <ul className="mt-3 text-sm text-[#E6EAF2]/70 list-disc pl-5 space-y-1">
              {cues.slice(0, 3).map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          )}
        </div>

        {imagen_url ? (
          <img src={imagen_url} alt={nombre} className="w-28 h-20 object-cover rounded-xl border border-white/10" />
        ) : (
          <div className="w-28 h-20 rounded-xl bg-white/5 border border-white/10" />
        )}
      </div>

      {!completed && (
      <button
        onClick={() => setOpen(v => !v)}
        role="button"
        aria-pressed={open}
        className="mt-4 text-sm font-medium underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A]"
        style={{ color: '#FF5A2A' }}
      >
        {open ? 'Ocultar detalles' : 'Ver detalles'}
      </button>
      )}

      {open && !completed && (
        <div className="mt-3 text-sm text-[#E6EAF2]/80 grid gap-2">
          {equipo?.length > 0 && (
            <div><span className="text-[#E6EAF2]/60">Equipo:</span> {equipo.join(', ')}</div>
          )}
          {contraindicaciones?.length > 0 && (
            <div>
              <span className="text-[#E6EAF2]/60">Contraindicaciones:</span>
              <ul className="list-disc pl-5">
                {contraindicaciones.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
