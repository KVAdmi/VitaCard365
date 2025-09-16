import SleepMonitor from '../../sleep/SleepMonitor';
import SleepChart from '../../sleep/SleepChart';
import SleepHistory from '../../sleep/SleepHistory';

export default function SuenoPage() {
  return (
    <div className="container mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-bold">Salud del Sueño</h2>
        <p className="opacity-80">Monitorea la calidad de tu descanso nocturno (fase 1: duración).</p>
      </header>

      <SleepMonitor onSaved={()=>location.reload()} />

      <SleepChart />

      <section>
        <h3 className="font-semibold mb-2">Historial</h3>
        <SleepHistory />
      </section>
    </div>
  );
}