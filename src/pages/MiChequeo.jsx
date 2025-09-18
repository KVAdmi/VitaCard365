import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { motion } from 'framer-motion';
import { Plus, Info } from 'lucide-react';
import NASAHistoryCardsPanel from '../components/mi-chequeo/NASAHistoryCardsPanel';
import { HeartPulse, Wind, Thermometer, Activity, Weight, Moon, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { triageTests, levelCopy } from '../lib/triageEngine';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MeasurementCard = ({ measurement }) => {
  const { toast } = useToast();

  const handleDownload = () => {
    toast({
      title: '🚧 Función no implementada',
      description: 'La descarga de PDF estará disponible próximamente.',
    });
  };

  const VitalsCard = ({ measurement }) => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      {measurement.vitals.pressure && (
        <div className="flex items-center space-x-2">
          <HeartPulse className="w-5 h-5 text-red-400" />
          <div>
            <span className="font-bold text-white">{measurement.vitals.pressure}</span>
            <span className="text-white/80 ml-1">mmHg</span>
          </div>
        </div>
      )}
      {measurement.vitals.heartRate && (
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-pink-400" />
          <div>
            <span className="font-bold text-white">{measurement.vitals.heartRate}</span>
            <span className="text-white/80 ml-1">BPM</span>
          </div>
        </div>
      )}
      {measurement.vitals.spo2 && (
        <div className="flex items-center space-x-2">
          <Wind className="w-5 h-5 text-blue-400" />
          <div>
            <span className="font-bold text-white">{measurement.vitals.spo2}</span>
            <span className="text-white/80 ml-1">%</span>
          </div>
        </div>
      )}
      {measurement.vitals.temperature && (
        <div className="flex items-center space-x-2">
          <Thermometer className="w-5 h-5 text-yellow-400" />
          <div>
            <span className="font-bold text-white">{measurement.vitals.temperature}</span>
            <span className="text-white/80 ml-1">°C</span>
          </div>
        </div>
      )}
    </div>
  );

  const WeightCard = ({ measurement }) => (
    <div className="flex items-center space-x-2">
      <Weight className="w-5 h-5 text-green-400" />
      <div>
        <span className="font-bold text-white">{measurement.vitals.weight}</span>
        <span className="text-white/80 ml-1">kg</span>
      </div>
      {measurement.vitals.bmi && (
        <div className="ml-4">
          <span className="font-bold text-white">{measurement.vitals.bmi.toFixed(1)}</span>
          <span className="text-white/80 ml-1">IMC</span>
        </div>
      )}
    </div>
  );

  const SleepCard = ({ measurement }) => {
    const scoreColor =
      measurement.score_sueno > 85
        ? 'text-green-400'
        : measurement.score_sueno > 70
        ? 'text-yellow-400'
        : 'text-red-400';
    return (
      <div className="flex items-center space-x-2">
        <Moon className="w-5 h-5 text-indigo-400" />
        <div>
          <span className="font-bold text-white">Calidad del Sueño: </span>
          <span className={`font-bold ${scoreColor}`}>{measurement.score_sueno}</span>
          <span className="text-white/80">/100</span>
        </div>
      </div>
    );
  };

  const TriageCard = ({ measurement }) => {
    const testTitle = triageTests[measurement.test_id]?.title || 'Test de Alertas';
    const advice = levelCopy[measurement.level]?.title || 'Recomendación';
    return (
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-5 h-5 text-orange-400" />
        <div>
          <span className="font-bold text-white">Test {testTitle}: </span>
          <span className="text-white/90">{advice}</span>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (measurement.type) {
      case 'vitals':
        return <VitalsCard measurement={measurement} />;
      case 'weight':
        return <WeightCard measurement={measurement} />;
      case 'sleep':
        return <SleepCard measurement={measurement} />;
      case 'triage':
        return <TriageCard measurement={measurement} />;
      default:
        return null;
    }
  };

  const time =
    measurement.time ||
    new Date(measurement.date || measurement.created_at).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).toUpperCase();

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-white/80">{time}</p>
            <div className="mt-3">{renderContent()}</div>
          </div>
          <div className="flex items-center gap-2">
            {/* TODO: aquí se podrán mostrar badges de origen en el futuro */}
            <Button
              variant="ghost"
              size="icon"
              className="text-vita-muted-foreground hover:text-white"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MiChequeo = () => {
  const navigate = useNavigate();
  const [measurements] = useLocalStorage('vita-measurements', []);
  const [sleepHistory] = useLocalStorage('vita-sleep-history', []);
  const [triageEvents] = useLocalStorage('vita-triage_events', []);

  const allEntries = React.useMemo(() => {
    const sleepData = sleepHistory.map((item) => ({
      ...item,
      date: item.date,
      type: 'sleep',
    }));
    const triageData = triageEvents.map((item) => ({
      ...item,
      date: item.created_at,
      type: 'triage',
    }));

    return [...measurements, ...sleepData, ...triageData].sort(
      (a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)
    );
  }, [measurements, sleepHistory, triageEvents]);

  const groupedMeasurements = React.useMemo(() => {
    return allEntries.reduce((acc, m) => {
      const dateKey = new Date(m.date || m.created_at).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const capitalizedDate = dateKey.charAt(0).toUpperCase() + dateKey.slice(1);
      if (!acc[capitalizedDate]) {
        acc[capitalizedDate] = [];
      }
      acc[capitalizedDate].push(m);
      return acc;
    }, {});
  }, [allEntries]);

  const evolutionChartData = React.useMemo(() => {
    const sortedData = [...allEntries]
      .filter((d) => d.type === 'vitals' || d.type === 'weight')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      labels: sortedData.map((d) =>
        new Date(d.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
      ),
      datasets: [
        {
          label: 'Peso (kg)',
          data: sortedData.map((d) => d.vitals?.weight),
          borderColor: '#4ade80',
          backgroundColor: 'rgba(74, 222, 128, 0.1)',
          yAxisID: 'yWeight',
          tension: 0.3,
          pointStyle: 'circle',
        },
        {
          label: 'Sistólica (mmHg)',
          data: sortedData.map((d) =>
            d.vitals?.pressure ? parseInt(d.vitals.pressure.split('/')[0]) : null
          ),
          borderColor: '#f87171',
          backgroundColor: 'rgba(248, 113, 113, 0.1)',
          yAxisID: 'yPressure',
          tension: 0.3,
          pointStyle: 'circle',
        },
        {
          label: 'Diastólica (mmHg)',
          data: sortedData.map((d) =>
            d.vitals?.pressure ? parseInt(d.vitals.pressure.split('/')[1]) : null
          ),
          borderColor: '#fb923c',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          yAxisID: 'yPressure',
          tension: 0.3,
          pointStyle: 'circle',
        },
        {
          label: 'Pulso (BPM)',
          data: sortedData.map((d) => d.vitals?.heartRate),
          borderColor: '#f472b6',
          backgroundColor: 'rgba(244, 114, 182, 0.1)',
          yAxisID: 'yPressure',
          tension: 0.3,
          pointStyle: 'circle',
        },
      ],
    };
  }, [allEntries]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: 'white' } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      yWeight: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Peso (kg)', color: 'white' },
        ticks: { color: '#4ade80' },
        grid: { drawOnChartArea: false },
      },
      yPressure: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Presión/Pulso', color: 'white' },
        ticks: { color: 'white' },
      },
    },
    interaction: { mode: 'index', intersect: false },
  };

  return (
    <Layout title="Mi Chequeo">
      <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h2 className="text-xl font-bold text-white">Historial de Mediciones</h2>
          <Button
            size="sm"
            className="bg-vita-orange text-white px-4 py-2 rounded-lg shadow hover:bg-vita-orange/90 transition-all"
            onClick={() => navigate('/mi-chequeo/nueva')}
          >
            <Plus className="mr-2 h-4 w-4" /> Registrar Nueva Medición
          </Button>
        </div>
        {/* Panel de tarjetas NASA glass, 100% responsive */}
        <NASAHistoryCardsPanel />
      </div>
    </Layout>
  );
};

export default MiChequeo;
