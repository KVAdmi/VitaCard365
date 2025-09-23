import React from "react";

const Item = ({ title, subtitle }) => (
  <div className="rounded-lg border border-white/10 bg-[#0b1626] p-3 flex items-center justify-between">
    <div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-white/60">{subtitle}</div>
    </div>
    <button type="button" className="px-3 py-2 rounded-lg border border-white/20 bg-[#0b1a30]">
      Conectar
    </button>
  </div>
);

export default function WearablesPanel() {
  return (
      <div className="space-y-3">
      <p className="text-sm text-white/70">
        Conecta tu reloj, pulsera o app para traer tus sesiones.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Item title="Android • Health Connect" subtitle="Sesiones, distancia, ritmo, HR" />
        <Item title="iOS • Apple Health"     subtitle="Sesiones, distancia, ritmo, HR" />
        <Item title="Samsung Health"         subtitle="A través de Health Connect" />
        <Item title="Garmin"                 subtitle="Garmin Health SDK/REST" />
        <Item title="Polar"                  subtitle="AccessLink API" />
        <Item title="COROS"                  subtitle="Training Hub API" />
        <Item title="Fitbit"                 subtitle="Web API" />
        <Item title="Oura"                   subtitle="Cloud API" />
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
