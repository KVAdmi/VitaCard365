import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { motion } from 'framer-motion';
import { Plus, Info, Download } from 'lucide-react';
import NASAHistoryCardsPanel from '../components/mi-chequeo/NASAHistoryCardsPanel';
import AudioCleanupPanel from '../components/mi-chequeo/AudioCleanupPanel';
import { Card, CardContent } from '../components/ui/card';
import { Bar } from 'react-chartjs-2';
import { HeartPulse, Wind, Thermometer, Activity, Weight, Moon, AlertTriangle } from 'lucide-react';
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

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MeasurementCard = ({ measurement }) => {
  const { toast } = useToast();
  const cardRef = useRef();

  const handleDownload = async () => {
    try {
      const element = cardRef.current;
      if (!element) throw new Error('No se encontró el contenido para exportar');
      const canvas = await html2canvas(element, { backgroundColor: '#18181b', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      // Ajustar tamaño manteniendo proporción
      const imgProps = canvas;
      const ratio = Math.min(pageWidth / imgProps.width, (pageHeight - 40) / imgProps.height);
      const imgWidth = imgProps.width * ratio;
      const imgHeight = imgProps.height * ratio;
      pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, 20, imgWidth, imgHeight);
      pdf.save('medicion-vitacard365.pdf');
      toast({ title: 'PDF generado', description: 'La descarga ha comenzado.' });
    } catch (e) {
      toast({ title: 'Error al exportar PDF', description: e.message });
    }
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
    <Card className="glass-card" ref={cardRef}>
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
  const { toast } = useToast();
  const [measurements] = useLocalStorage('vita-measurements', []);
  const [sleepHistory] = useLocalStorage('vita-sleep-history', []);
  const [triageEvents] = useLocalStorage('vita-triage_events', []);
  const mainPanelRef = useRef();

  // Exportar PDF profesional del panel principal
  const handleExportPDF = async () => {
    try {
      const element = mainPanelRef.current;
      if (!element) throw new Error('No se encontró el panel principal para exportar');
      const canvas = await html2canvas(element, { backgroundColor: '#18181b', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      // Branding y título elegante
      pdf.setFillColor('#18181b');
      pdf.rect(0, 0, pageWidth, 80, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor('#60a5fa');
      pdf.setFontSize(28);
      pdf.text('VitaCard365 - Resumen de Salud', pageWidth/2, 48, { align: 'center' });
      pdf.setFontSize(14);
      pdf.setTextColor('#fff');
      pdf.text('Reporte generado: ' + new Date().toLocaleString('es-ES'), pageWidth/2, 68, { align: 'center' });
      // Imagen del panel
      const marginTop = 90;
      const ratio = Math.min(pageWidth / canvas.width, (pageHeight - marginTop - 24) / canvas.height);
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, marginTop, imgWidth, imgHeight);
      // Footer institucional
      pdf.setFontSize(10);
      pdf.setTextColor('#aaa');
      pdf.text('VitaCard365 · Salud y Bienestar · confidencial', pageWidth/2, pageHeight - 16, { align: 'center' });
      pdf.save('resumen-salud-vitacard365.pdf');
      toast({ title: 'PDF generado', description: 'La descarga ha comenzado.' });
    } catch (e) {
      toast({ title: 'Error al exportar PDF', description: e.message });
    }
  };

  // Limitar histórico de sueño a los últimos 7 días
  const sevenDaysAgo = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6); // Incluye hoy
    d.setHours(0,0,0,0);
    return d;
  }, []);

  // Filtrar sleepHistory y triageEvents a los últimos 7 días
  const filteredSleepHistory = React.useMemo(() =>
    sleepHistory.filter(item => new Date(item.date) >= sevenDaysAgo),
    [sleepHistory, sevenDaysAgo]
  );
  const filteredTriageEvents = React.useMemo(() =>
    triageEvents.filter(item => new Date(item.created_at) >= sevenDaysAgo),
    [triageEvents, sevenDaysAgo]
  );

  // Unificar todas las entradas para la gráfica general (solo últimos 7 días)
  const allEntries = React.useMemo(() => {
    const sleepData = filteredSleepHistory.map((item) => ({
      ...item,
      date: item.date,
      type: 'sleep',
    }));
    const triageData = filteredTriageEvents.map((item) => ({
      ...item,
      date: item.created_at,
      type: 'triage',
    }));
    return [...measurements, ...sleepData, ...triageData].sort(
      (a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)
    );
  }, [measurements, filteredSleepHistory, filteredTriageEvents]);

  // Extraer la última sesión de sueño (de los últimos 7 días) para el panel principal
  const lastSleep = React.useMemo(() => {
    if (!filteredSleepHistory.length) return null;
    // Ordenar por fecha descendente
    const sorted = [...filteredSleepHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted[0];
  }, [filteredSleepHistory]);

  // Preparar datos para la gráfica de sueño (dB y ronquidos)
  const sleepChartData = React.useMemo(() => {
    if (!lastSleep || !lastSleep.timeseries) return null;
    // timeseries: [{ts, db, snore_prob, is_snore}]
    const labels = lastSleep.timeseries.map((d) =>
      new Date(d.ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    );
    return {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'dB',
          data: lastSleep.timeseries.map((d) => d.db),
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96,165,250,0.1)',
          yAxisID: 'yDb',
          tension: 0.3,
          pointRadius: 0,
        },
        {
          type: 'bar',
          label: 'Ronquidos',
          data: lastSleep.timeseries.map((d) => d.is_snore ? d.db : 0),
          backgroundColor: 'rgba(251,191,36,0.7)',
          yAxisID: 'yDb',
          borderRadius: 4,
          barPercentage: 1.0,
          categoryPercentage: 1.0,
        },
      ],
    };
  }, [lastSleep]);

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
        <div className="flex justify-end mb-2">
          <Button
            size="sm"
            className="bg-vita-blue-light text-white px-4 py-2 rounded-lg shadow hover:bg-vita-blue transition-all"
            onClick={handleExportPDF}
            title="Exportar PDF profesional del resumen"
          >
            <Download className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        </div>
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


        {/* Panel principal de calidad de sueño y gráfica, exportable */}
        <div ref={mainPanelRef} className="mb-8">
          {lastSleep && (
            <Card className="glass-card mb-8">
              <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 min-w-[220px]">
                  <h3 className="text-lg font-bold text-vita-white mb-1">Calidad de Sueño (última noche)</h3>
                  <div className="flex flex-wrap gap-4 items-center mb-2">
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-extrabold text-vita-blue-light drop-shadow">{lastSleep.sleep_score ?? '--'}</span>
                      <span className="text-xs text-vita-muted-foreground">Sleep Score</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-white">{lastSleep.minutes ? (lastSleep.minutes/60).toFixed(1) : '--'} h</span>
                      <span className="text-xs text-vita-muted-foreground">Horas dormidas</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-yellow-300">{lastSleep.snore_minutes ?? '--'}</span>
                      <span className="text-xs text-vita-muted-foreground">Min. roncando</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-orange-400">{lastSleep.interruptions ?? '--'}</span>
                      <span className="text-xs text-vita-muted-foreground">Interrupciones</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-xs text-vita-muted-foreground">Última sesión: {lastSleep.date ? new Date(lastSleep.date).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : '--'}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-[260px] h-40">
                  {sleepChartData ? (
                    <Bar data={sleepChartData} options={sleepChartOptions} height={160} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-vita-muted-foreground">Sin datos de gráfica</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Panel de limpieza de audios locales y privacidad */}
        <AudioCleanupPanel />

        {/* Panel de tarjetas NASA glass, 100% responsive */}
        <NASAHistoryCardsPanel />
      </div>
    </Layout>
  );
};

export default MiChequeo;
