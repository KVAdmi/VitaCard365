import React, { useCallback } from "react";
import { toast } from '../ui/use-toast';


const PROXIMAMENTE = [
  'Garmin',
  'Polar',
  'COROS',
  'Fitbit',
  'Oura',
];

const Item = ({ title, subtitle, soon, onConnect, active }) => (
  <div className="rounded-lg border border-white/10 bg-[#0b1626] p-3 flex items-center justify-between">
    <div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-white/60">{subtitle}</div>
    </div>
    <button
      type="button"
      onClick={onConnect}
      className={
        `px-3 py-2 rounded-lg border border-white/20 bg-[#0b1a30] transition-shadow relative ` +
        (active ? 'shadow-[0_0_24px_4px_rgba(92,233,225,0.45)] animate-pulse-smooth' : '')
      }
    >
      Conectar
    </button>
  </div>
);


export default function WearablesPanel() {
  // Modal bonito: solo toast, pero puedes cambiar a modal si tienes uno global
  const handleSoon = useCallback((name) => {
    toast({
      title: 'Próximamente',
      description: `La integración con ${name} estará disponible pronto. ¡Espérala!`,
      variant: 'default',
      duration: 3500,
    });
  }, []);

  // Opciones
  const items = [
    { title: 'Android • Health Connect', subtitle: 'Sesiones, distancia, ritmo, HR' },
    { title: 'iOS • Apple Health', subtitle: 'Sesiones, distancia, ritmo, HR' },
    { title: 'Samsung Health', subtitle: 'A través de Health Connect' },
    { title: 'Garmin', subtitle: 'Garmin Health SDK/REST' },
    { title: 'Polar', subtitle: 'AccessLink API' },
    { title: 'COROS', subtitle: 'Training Hub API' },
    { title: 'Fitbit', subtitle: 'Web API' },
    { title: 'Oura', subtitle: 'Cloud API' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/70">
        Conecta tu reloj, pulsera o app para traer tus sesiones.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map(({ title, subtitle }) => {
          const soon = PROXIMAMENTE.includes(title.split(' ')[0]);
          const active = !soon;
          return (
            <Item
              key={title}
              title={title}
              subtitle={subtitle}
              soon={soon}
              active={active}
              onConnect={soon ? () => handleSoon(title) : undefined}
            />
          );
        })}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-3 flex items-center justify-between">
        <div>
          <div className="font-semibold">Sincronización automática</div>
          <div className="text-sm text-white/60">Cuando hay nueva actividad, importarla al finalizar.</div>
        </div>
        <button type="button" className="px-3 py-2 rounded-lg border border-white/20 bg-[#0b1a30]">
          Activar
        </button>
      </div>
    </div>
  );
}
