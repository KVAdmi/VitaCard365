// src/pages/MiPlan.jsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Simulación de datos de plan y familiares (reemplaza por fetch real/Supabase)
const mockPlan = {
  type: "familiar", // "individual" o "familiar"
  titular: { nombre: "Juan Pérez" },
  familiares: [
    { nombre: "Ana Pérez" },
    { nombre: "Luis Pérez" },
  ],
  fechaCompra: "2025-09-14T13:00:00Z",
  frecuencia: "trimestral", // monthly, quarterly, semiannually, annually
};

const FRECUENCIA_MESES = {
  monthly: 1,
  quarterly: 3,
  semiannually: 6,
  annually: 12,
};

function calcularProximaFecha(fechaCompra, frecuencia) {
  const meses = FRECUENCIA_MESES[frecuencia] || 1;
  const fecha = new Date(fechaCompra);
  fecha.setMonth(fecha.getMonth() + meses);
  return fecha.toLocaleDateString();
}

export default function MiPlan() {
  // Reemplaza mockPlan por datos reales del usuario
  const plan = mockPlan;

  return (
    <div className="min-h-screen bg-[#0b1a2b] text-white px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mi Plan</h1>
      <div className="rounded-xl bg-white/5 border border-white/10 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Resumen de tu Plan</h2>
        <div className="flex justify-between items-center mb-2">
          <span>Tipo de Plan</span>
          <span className="font-bold">{plan.type === "familiar" ? "Familiar" : "Individual"}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span>Fecha de compra</span>
          <span>{new Date(plan.fechaCompra).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span>Próximo Pago</span>
          <span>{calcularProximaFecha(plan.fechaCompra, plan.frecuencia)}</span>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-2">Miembros del Plan</h2>
      <div className="rounded-xl bg-white/10 border border-white/20 p-4">
        <div className="mb-2">
          <span className="font-bold">Titular:</span> {plan.titular.nombre}
        </div>
        {plan.type === "familiar" && (
          <div className="mt-2">
            <span className="font-bold">Familiares asegurados:</span>
            <div className="mt-1 grid gap-2">
              {plan.familiares.map((f, idx) => (
                <div key={idx} className="rounded bg-white/20 px-3 py-2">
                  {f.nombre}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
