// src/components/rutina/PlanHeader.tsx
type Props = {
  objetivo: string;
  semana: number;
  dia: number;
};

export default function PlanHeader({ objetivo, semana, dia }: Props) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl md:text-4xl font-bold text-[#E6EAF2]">Crear Rutina</h1>
      <p className="mt-2 text-[#E6EAF2]/80 text-sm md:text-base">
        {objetivo?.toUpperCase()} · Semana {semana} · Día {dia}
      </p>
      <div className="mt-3 h-1 w-24 rounded-full" style={{ backgroundColor: '#FF5A2A' }} />
    </header>
  );
}
