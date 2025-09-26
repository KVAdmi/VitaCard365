// src/components/rutina/GoalTest.tsx
import { useState } from 'react';

type Payload = {
  objetivo: 'grasa'|'musculo'|'movilidad'|'cardio'|'mixto';
  diasSemana: 3|4|5;
  minutosSesion: 20|25|30|35|40|45;
  sexo: 'F'|'M';
  edad: number;
  altura_cm: number;
  peso_kg: number;
  nivel: 0|1|2|3;
  equipo: string[]; // ['ninguno','tapete','toalla','mochila','superficie']
};

export default function GoalTest({ onSubmit }: { onSubmit: (p: Payload) => void }) {
  const [form, setForm] = useState<Payload>({
    objetivo: 'grasa',
    diasSemana: 4,
    minutosSesion: 25,
    sexo: 'F',
    edad: 30,
    altura_cm: 165,
    peso_kg: 70,
    nivel: 1,
    equipo: ['ninguno','tapete']
  });

  const onChange = (k: keyof Payload, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const equipoOptions = ['ninguno','tapete','toalla','mochila','superficie'];

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-5 md:p-6" role="group" aria-label="Configurar objetivo de rutina">
      <h2 className="text-xl font-semibold text-[#E6EAF2]">Creamos tu plan en 30 segundos</h2>

      {/* Grupo 1: Objetivo */}
      <div className="mt-4">
        <div className="text-sm text-[#E6EAF2]/70 mb-2">¿Qué quieres trabajar?</div>
        <div className="flex flex-wrap gap-2">
          {(['grasa','musculo','movilidad','cardio','mixto'] as const).map(opt => {
            const checked = form.objetivo === opt;
            return (
              <button key={opt} type="button" aria-pressed={checked}
                onClick={() => onChange('objetivo', opt)}
                className={`px-3 py-2 rounded-2xl border ${checked ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A]`}
              >{opt}</button>
            );
          })}
        </div>
      </div>

      {/* Grupo 2: Entorno y Días */}
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-[#E6EAF2]/70 mb-2">¿Dónde entrenas?</div>
          <div className="flex gap-2 mb-3">
            {['Gym','Casa'].map(opt => (
              <button key={opt} type="button" aria-pressed={true}
                className={`px-3 py-2 rounded-2xl border bg-white/10 border-white/15 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A]`}
              >{opt}</button>
            ))}
          </div>
          <div className="text-sm text-[#E6EAF2]/70 mb-2">¿Cuántos días por semana?</div>
          <div className="flex gap-2">
            {[3,4,5].map(n => (
              <button key={n} type="button" aria-pressed={form.diasSemana===n}
                onClick={() => onChange('diasSemana', n)}
                className={`px-3 py-2 rounded-2xl border ${form.diasSemana===n?'bg-white/20 border-white/30':'bg-white/5 border-white/10'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A]`}
              >{n} días</button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm text-[#E6EAF2]/70 mb-2">Minutos por sesión</div>
          <div className="flex gap-2 flex-wrap">
            {[20,25,30,35,40,45].map(n => (
              <button key={n} type="button" aria-pressed={form.minutosSesion===n}
                onClick={() => onChange('minutosSesion', n)}
                className={`px-3 py-2 rounded-2xl border ${form.minutosSesion===n?'bg-white/20 border-white/30':'bg-white/5 border-white/10'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A]`}
              >{n} min</button>
            ))}
          </div>
        </div>
      </div>

      {/* Grupo 3: Nivel */}
      <div className="mt-4">
        <div className="text-sm text-[#E6EAF2]/70 mb-2">Tu nivel</div>
        <div className="flex gap-2">
          {[0,1,2,3].map(n => (
            <button key={n} type="button" aria-pressed={form.nivel===n}
              onClick={() => onChange('nivel', n)}
              className={`px-3 py-2 rounded-2xl border ${form.nivel===n?'bg-white/20 border-white/30':'bg-white/5 border-white/10'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A]`}
            >{n===0?'Básico':n===1?'Intermedio':n===2?'Avanzado':'Pro'}</button>
          ))}
        </div>
      </div>

      {/* Grupo 4: Equipo */}
      <div className="mt-4">
        <div className="text-sm text-[#E6EAF2]/70 mb-2">Equipo disponible</div>
        <div className="flex flex-wrap gap-2">
          {['ninguno','tapete','toalla','mochila','superficie'].map(opt => {
            const checked = form.equipo.includes(opt);
            return (
              <button
                type="button"
                key={opt}
                onClick={() => {
                  const next = checked ? form.equipo.filter(x => x !== opt) : [...form.equipo, opt];
                  onChange('equipo', next);
                }}
                role="button"
                aria-pressed={checked}
                className={`text-sm px-3 py-2 rounded-2xl border transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A] ${checked ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10'}`}
              >{opt}</button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => onSubmit(form)}
          role="button"
          className="rounded-xl px-5 py-3 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A]"
          style={{ backgroundColor: '#FF5A2A' }}
        >
          Crear mi plan ahora
        </button>
      </div>
    </div>
  );
}
