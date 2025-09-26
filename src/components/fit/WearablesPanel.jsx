import React from "react";


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
  // Opciones soportadas actualmente
  const items = [
    { title: 'Android • Health Connect', subtitle: 'Sesiones, distancia, ritmo, HR' },
    { title: 'iOS • Apple Health', subtitle: 'Sesiones, distancia, ritmo, HR' },
    { title: 'Samsung Health', subtitle: 'A través de Health Connect' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/70">
        Conecta tu reloj, pulsera o app para traer tus sesiones.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map(({ title, subtitle }) => (
          <Item
            key={title}
            title={title}
            subtitle={subtitle}
            active
          />
        ))}
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
