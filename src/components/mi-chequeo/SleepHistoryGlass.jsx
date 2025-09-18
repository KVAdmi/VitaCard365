import React, { useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Bar } from 'react-chartjs-2';

export default function SleepHistoryGlass({ sleepHistory }) {
  // Limitar a los últimos 7 días
  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    d.setHours(0,0,0,0);
    return d;
  }, []);
  const filtered = useMemo(() =>
    sleepHistory.filter(item => new Date(item.date) >= sevenDaysAgo),
    [sleepHistory, sevenDaysAgo]
  );
  // Gráfica de horas dormidas
  const chartData = useMemo(() => {
    return {
      labels: filtered.map(d => new Date(d.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })),
      datasets: [
        {
          label: 'Horas dormidas',
          data: filtered.map(d => d.duracion_monitorizada ? (d.duracion_monitorizada/60).toFixed(2) : 0),
          backgroundColor: 'rgba(74,222,128,0.7)',
          borderRadius: 8,
        },
        {
          label: 'Sleep Score',
          data: filtered.map(d => d.score_sueno ?? null),
          type: 'line',
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96,165,250,0.1)',
          yAxisID: 'yScore',
          tension: 0.3,
          pointRadius: 4,
        },
      ],
    };
  }, [filtered]);
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: 'white' } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Horas', color: 'white' },
        ticks: { color: '#4ade80' },
        grid: { color: 'rgba(255,255,255,0.08)' },
      },
      yScore: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Score', color: 'white' },
        ticks: { color: '#60a5fa' },
        grid: { drawOnChartArea: false },
        min: 0,
        max: 100,
      },
    },
    interaction: { mode: 'index', intersect: false },
  };
  return (
    <Card className="glass-card mb-8">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-vita-white mb-2">Histórico de Sueño (7 días)</h3>
        <div className="h-48">
          <Bar data={chartData} options={chartOptions} height={180} />
        </div>
      </CardContent>
    </Card>
  );
}
