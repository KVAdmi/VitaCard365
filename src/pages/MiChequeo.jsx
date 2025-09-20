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
        {/* Temperatura eliminada completamente, no mostrar tarjeta ni placeholder */}
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

  // Exportar PDF profesional con branding, tabla y gráfica de los últimos 7 días para cada tipo de medición
  const handleExportPDF = async () => {
    try {
      // Esperar a que el gráfico esté renderizado
      await new Promise(resolve => setTimeout(resolve, 500));
      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      // Branding y portada
      pdf.setFillColor('#18181b');
      pdf.rect(0, 0, pageWidth, 100, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor('#60a5fa');
      pdf.setFontSize(28);
      pdf.text('VitaCard365', pageWidth/2, 54, { align: 'center' });
      pdf.setFontSize(16);
      pdf.setTextColor('#fff');
      pdf.text('Reporte profesional de salud', pageWidth/2, 80, { align: 'center' });
      pdf.setFontSize(12);
      pdf.setTextColor('#aaa');
      pdf.text('Generado: ' + new Date().toLocaleString('es-ES'), pageWidth/2, 98, { align: 'center' });

      let y = 120;
      // Tabla de resultados de los últimos 7 días para cada tipo
      const tipos = [
        { key: 'pressure', label: 'Presión arterial (mmHg)' },
        { key: 'glucose', label: 'Glucosa (mg/dL)' },
        { key: 'spo2', label: 'SpO₂ (%)' },
        { key: 'heartRate', label: 'Pulso (BPM)' },
        { key: 'weight', label: 'Peso (kg)' },
        { key: 'sleep_score', label: 'Calidad de sueño' },
      ];
      const dias = Array.from({length: 7}, (_,i) => {
        const d = new Date(); d.setDate(d.getDate()-i);
        return d.toLocaleDateString('es-ES', { day:'2-digit', month:'short' });
      }).reverse();
      pdf.setFontSize(14);
      pdf.setTextColor('#f06340');
      pdf.text('Resultados de los últimos 7 días', pageWidth/2, y, { align: 'center' });
      y += 18;
      pdf.setFontSize(11);
      pdf.setTextColor('#fff');
      // Encabezado de tabla
      let x = 60;
      pdf.text('Tipo', x, y);
      dias.forEach((d, i) => pdf.text(d, x+90+i*60, y));
      y += 14;
      // Filas de tabla
      tipos.forEach(tipo => {
        pdf.setTextColor('#f06340');
        pdf.text(tipo.label, x, y);
        pdf.setTextColor('#fff');
        dias.forEach((d, i) => {
          let val = '';
          // Buscar medición de ese día
          const fecha = new Date(); fecha.setDate(fecha.getDate()-(6-i)); fecha.setHours(0,0,0,0);
          const entry = allEntries.find(e => {
            const ed = new Date(e.date || e.created_at); ed.setHours(0,0,0,0);
            return ed.getTime() === fecha.getTime();
          });
          if (entry) {
            if (tipo.key === 'pressure' && entry.vitals?.pressure) val = entry.vitals.pressure;
            if (tipo.key === 'glucose' && entry.vitals?.glucose) val = String(entry.vitals.glucose);
            if (tipo.key === 'spo2' && entry.vitals?.spo2) val = String(entry.vitals.spo2);
            if (tipo.key === 'heartRate' && entry.vitals?.heartRate) val = String(entry.vitals.heartRate);
            if (tipo.key === 'weight' && entry.vitals?.weight) val = String(entry.vitals.weight);
            if (tipo.key === 'sleep_score' && entry.sleep_score) val = String(entry.sleep_score);
          }
          pdf.text(val || '--', x+90+i*60, y);
        });
        y += 14;
      });

      y += 18;
      // Gráfica de evolución (captura del panel principal)
      const element = mainPanelRef.current;
      if (element) {
        // Esperar a que el canvas de Chart.js esté presente
        const chartCanvas = element.querySelector('canvas');
        if (!chartCanvas) throw new Error('No se encontró el gráfico para exportar.');
        // Forzar re-render y esperar
        await new Promise(resolve => setTimeout(resolve, 300));
        const canvas = await html2canvas(element, { backgroundColor: '#18181b', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        if (!imgData.startsWith('data:image/png')) throw new Error('No se pudo generar la imagen del gráfico.');
        const imgWidth = pageWidth-120;
        const imgHeight = (canvas.height/canvas.width)*imgWidth;
        pdf.addImage(imgData, 'PNG', 60, y, imgWidth, imgHeight);
        y += imgHeight+10;
      } else {
        throw new Error('No se encontró el panel principal para exportar.');
      }

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


        {/* Panel principal de calidad de sueño y gráfica, exportable, con botón PDF */}
        <div ref={mainPanelRef} className="mb-8">
          {lastSleep && (
            <Card className="glass-card mb-8">
              <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center sm:items-stretch">
                <div className="flex-1 min-w-[180px] max-w-full flex flex-col justify-center items-center sm:items-start">
                  <div className="flex justify-between w-full mb-1">
                    <h3 className="text-lg font-bold text-vita-white">Calidad de Sueño (última noche)</h3>
                    <button
                      className="rounded-lg px-3 py-1 bg-[#f06340] text-white text-xs font-bold flex items-center gap-1"
                      onClick={async () => {
                        try {
                          await new Promise(res => setTimeout(res, 400));
                          const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
                          const pageWidth = pdf.internal.pageSize.getWidth();
                          const pageHeight = pdf.internal.pageSize.getHeight();
                          pdf.setFillColor('#18181b');
                          pdf.rect(0, 0, pageWidth, 100, 'F');
                          pdf.setFont('helvetica', 'bold');
                          pdf.setTextColor('#60a5fa');
                          pdf.setFontSize(28);
                          pdf.text('VitaCard365', pageWidth/2, 54, { align: 'center' });
                          pdf.setFontSize(16);
                          pdf.setTextColor('#fff');
                          pdf.text('Reporte de Calidad de Sueño', pageWidth/2, 80, { align: 'center' });
                          pdf.setFontSize(12);
                          pdf.setTextColor('#aaa');
                          pdf.text('Generado: ' + new Date().toLocaleString('es-ES'), pageWidth/2, 98, { align: 'center' });
                          let y = 120;
                          // Tabla de los últimos 7 días
                          const dias = Array.from({length: 7}, (_,i) => {
                            const d = new Date(); d.setDate(d.getDate()-i);
                            return d.toLocaleDateString('es-ES', { day:'2-digit', month:'short' });
                          }).reverse();
                          pdf.setFontSize(14);
                          pdf.setTextColor('#f06340');
                          pdf.text('Calidad de sueño últimos 7 días', pageWidth/2, y, { align: 'center' });
                          y += 18;
                          pdf.setFontSize(11);
                          pdf.setTextColor('#fff');
                          pdf.text('Día', 60, y);
                          dias.forEach((d, i) => pdf.text(d, 110+i*60, y));
                          y += 14;
                          pdf.setTextColor('#f06340');
                          pdf.text('Score', 60, y);
                          pdf.setTextColor('#fff');
                          dias.forEach((d, i) => {
                            const fecha = new Date(); fecha.setDate(fecha.getDate()-(6-i)); fecha.setHours(0,0,0,0);
                            const entry = sleepHistory.find(e => {
                              const ed = new Date(e.date); ed.setHours(0,0,0,0);
                              return ed.getTime() === fecha.getTime();
                            });
                            pdf.text(entry?.sleep_score ? String(entry.sleep_score) : '--', 110+i*60, y);
                          });
                          y += 18;
                          // Gráfica (captura de la tarjeta)
                          const cardDiv = mainPanelRef.current?.querySelector('.glass-card');
                          if (cardDiv) {
                            const canvas = await html2canvas(cardDiv, { backgroundColor: '#18181b', scale: 2 });
                            const imgData = canvas.toDataURL('image/png');
                            if (!imgData.startsWith('data:image/png')) throw new Error('No se pudo generar la imagen del gráfico.');
                            const imgWidth = pageWidth-120;
                            const imgHeight = (canvas.height/canvas.width)*imgWidth;
                            pdf.addImage(imgData, 'PNG', 60, y, imgWidth, imgHeight);
                            y += imgHeight+10;
                          }
                          pdf.setFontSize(10);
                          pdf.setTextColor('#aaa');
                          pdf.text('VitaCard365 · Salud y Bienestar · confidencial', pageWidth/2, pageHeight - 16, { align: 'center' });
                          pdf.save('sueno-vitacard365.pdf');
                        } catch (e) {
                          alert('Error al exportar PDF: ' + e.message);
                        }
                      }}
                    >
                      <Download className="h-4 w-4" /> Descargar PDF
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-4 items-center justify-center sm:justify-start mb-2">
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
                <div className="flex-1 min-w-[200px] max-w-full h-40 flex items-center justify-center">
                  {sleepChartData ? (
                    <Bar data={sleepChartData} options={sleepChartOptions} height={140} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-vita-muted-foreground text-center text-xs">Sin datos de gráfica</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

  {/* Panel de limpieza de audios locales y privacidad (solo visible en calidad de sueño) */}
  {/* <AudioCleanupPanel /> */}

        {/* Panel de tarjetas NASA glass, 100% responsive */}
        <NASAHistoryCardsPanel />
      </div>
    </Layout>
  );
};

export default MiChequeo;
