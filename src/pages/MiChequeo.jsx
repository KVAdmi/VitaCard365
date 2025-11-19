import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { motion } from 'framer-motion';
import { Plus, Info } from 'lucide-react';

import NASAHistoryCardsPanel from '../components/mi-chequeo/NASAHistoryCardsPanel';
// import AudioCleanupPanel from '../components/mi-chequeo/AudioCleanupPanel';
import { Card, CardContent } from '../components/ui/card';
import { Bar } from 'react-chartjs-2';
import { HeartPulse, Wind, Activity, Weight, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarController,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { triageTests, levelCopy } from '../lib/triageEngine';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
// Sleep module totalmente desactivado en UI

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarController,
  BarElement,
  Title,
  Tooltip,
  Legend
);



const MeasurementCard = ({ measurement }) => {
  const { toast } = useToast();
  const cardRef = useRef();

  // Botón de descarga de PDF removido según solicitud

  const VitalsCard = ({ measurement }) => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      {measurement.vitals.pressure && (
        <div className="flex items-center space-x-2">
          <HeartPulse className="w-5 h-5 text-vita-orange" />
          <div>
            <span className="font-bold text-white">{measurement.vitals.pressure}</span>
            <span className="text-white/80 ml-1">mmHg</span>
          </div>
        </div>
      )}
      {measurement.vitals.heartRate && (
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-vita-orange" />
          <div>
            <span className="font-bold text-white">{measurement.vitals.heartRate}</span>
            <span className="text-white/80 ml-1">BPM</span>
          </div>
        </div>
      )}
      {measurement.vitals.spo2 && (
        <div className="flex items-center space-x-2">
          <Wind className="w-5 h-5 text-vita-orange" />
          <div>
            <span className="font-bold text-white">{measurement.vitals.spo2}</span>
            <span className="text-white/80 ml-1">%</span>
          </div>
        </div>
      )}
        {/* Temperatura eliminada completamente, no mostrar tarjeta ni placeholder */}
    </div>
  );

  const WeightCard = ({ measurement }) => (
    <div className="flex items-center space-x-2">
      <Weight className="w-5 h-5 text-vita-orange" />
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

  // SleepCard eliminado

  const TriageCard = ({ measurement }) => {
    const testTitle = triageTests[measurement.test_id]?.title || 'Test de Alertas';
    const advice = levelCopy[measurement.level]?.title || 'Recomendación';
    return (
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-5 h-5 text-vita-orange" />
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
      // case 'sleep': eliminado
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
    <Card className="glass-card" ref={cardRef}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-white/80">{time}</p>
            <div className="mt-3">{renderContent()}</div>
          </div>
          <div className="flex items-center gap-2">{/* badges de origen (futuro) */}</div>
        </div>
      </CardContent>
    </Card>
  );
};

const MiChequeo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [measurements] = useLocalStorage('vita-measurements', []);
  const [sleepHistory] = useLocalStorage('vita-sleep-history', []);
  const [triageEvents] = useLocalStorage('vita-triage_events', []);
  const mainPanelRef = useRef();
  const [medDb, setMedDb] = useState([]);

  // Exportación a PDF deshabilitada por solicitud

  // Limitar histórico de sueño a los últimos 7 días (solo si el módulo está activo)
  // Sleep: filtros y cálculos eliminados
  const sevenDaysAgo = React.useMemo(() => null, []);

  // Cargar datos reales de 'mediciones' (últimos 30 días) del usuario autenticado
  useEffect(() => {
    (async () => {
      try {
        if (!user?.id) return;
        const from = new Date();
        from.setDate(from.getDate() - 30);
        const { data, error } = await supabase
          .from('mediciones')
          .select('*')
          .eq('usuario_id', user.id)
          .gte('ts', from.toISOString())
          .order('ts', { ascending: true });
        if (!error) setMedDb(data || []);
      } catch (e) {
        console.warn('No se pudieron cargar mediciones:', e?.message || e);
      }
    })();
  }, [user?.id]);

  // Filtrar sleepHistory y triageEvents a los últimos 7 días
  const filteredSleepHistory = React.useMemo(() => [], []);
  const filteredTriageEvents = React.useMemo(() =>
    triageEvents.filter(item => new Date(item.created_at) >= sevenDaysAgo),
    [triageEvents, sevenDaysAgo]
  );

  // Unificar todas las entradas para la gráfica general (solo últimos 7 días)
  // Feed combinado sólo para tarjetas (mantiene sleep/triage locales si aplica)
  const allEntries = React.useMemo(() => {
    const sleepData = filteredSleepHistory.map((item) => ({ ...item, date: item.date, type: 'sleep' }));
    const triageData = filteredTriageEvents.map((item) => ({ ...item, date: item.created_at, type: 'triage' }));
    return [...sleepData, ...triageData].sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
  }, [filteredSleepHistory, filteredTriageEvents]);

  // Extraer la última sesión de sueño (de los últimos 7 días) para el panel principal
  const lastSleep = React.useMemo(() => null, []);

  // Preparar datos para la gráfica de sueño (dB y ronquidos)
  const sleepChartData = React.useMemo(() => null, []);

  const sleepChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: 'white' } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { ticks: { color: 'white', maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.1)' } },
      yDb: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'dB', color: 'white' },
        ticks: { color: '#60a5fa' },
        grid: { color: 'rgba(255,255,255,0.08)' },
      },
    },
    interaction: { mode: 'index', intersect: false },
  };

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
    // Construir series desde 'mediciones'
    const series = medDb;
    // fechas únicas
    const labelDates = Array.from(new Set(series.map(r => r.ts))).sort((a,b)=> new Date(a) - new Date(b));
    const fmt = (iso) => new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    const labels = labelDates.map(fmt);
    const findForDay = (pred) => labelDates.map(dIso => {
      const row = series.find(r => pred(r) && new Date(r.ts).toDateString()===new Date(dIso).toDateString());
      return row ? row : null;
    });
    const dataWeight = findForDay(r => r.peso_kg != null).map(r => r ? Number(r.peso_kg) : null);
    const dataSis = findForDay(r => r.sistolica != null).map(r => r ? r.sistolica : null);
    const dataDia = findForDay(r => r.diastolica != null).map(r => r ? r.diastolica : null);
    const dataPulse = findForDay(r => r.pulso_bpm != null).map(r => r ? r.pulso_bpm : null);

    return {
      labels,
      datasets: [
        { label: 'Peso (kg)', data: dataWeight, borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)', yAxisID: 'yWeight', tension: 0.3, pointStyle: 'circle' },
        { label: 'Sistólica (mmHg)', data: dataSis, borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)', yAxisID: 'yPressure', tension: 0.3, pointStyle: 'circle' },
        { label: 'Diastólica (mmHg)', data: dataDia, borderColor: '#fb923c', backgroundColor: 'rgba(251,146,60,0.1)', yAxisID: 'yPressure', tension: 0.3, pointStyle: 'circle' },
        { label: 'Pulso (BPM)', data: dataPulse, borderColor: '#f472b6', backgroundColor: 'rgba(244,114,182,0.1)', yAxisID: 'yPressure', tension: 0.3, pointStyle: 'circle' },
      ],
    };
  }, [medDb]);

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
        {/* Botón global de Exportar PDF removido */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h2 className="text-xl font-bold text-white">Historial de Salud</h2>
          <Button
            size="sm"
            className="bg-vita-orange text-white px-4 py-2 rounded-lg shadow hover:bg-vita-orange/90 transition-all"
            onClick={() => navigate('/mi-chequeo/nueva')}
          >
            <Plus className="mr-2 h-4 w-4" /> Registrar Nueva Medición
          </Button>
        </div>


        {/* Panel de calidad de sueño eliminado */}

  {/* Panel de limpieza de audios locales y privacidad (solo visible en calidad de sueño) */}
  {/* <AudioCleanupPanel /> */}

        {/* Panel de tarjetas NASA glass, 100% responsive */}
        <NASAHistoryCardsPanel />
      </div>
    </Layout>
  );
};

export default MiChequeo;
