import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../components/ui/card';
import { Doughnut, Line, Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale);

/**
 * Tarjeta tipo NASA para historial de medidas.
 * - Glassmorphism, animaciones sutiles, sin emojis.
 * - Gráfica semanal (simulada), botón PDF, autolimpieza tras 7 días (solo UI).
 * - Profesional, impactante, siguiendo la línea visual de la app.
 */

// Ahora acepta: chartRef, fullRecords (todas las tomas diarias)
const NASAHistoryCard = ({ title, subtitle, data, onDownloadPDF, multiLine, chartType, chartRef, fullRecords }) => {
  // chartType: 'doughnut' | 'radar' | 'line' | 'bar' | 'gauge' | 'area'
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  // Ref para el canvas de la gráfica
  const localChartRef = useRef(null);
  // Permitir que el padre obtenga el canvas real
  useEffect(() => {
    if (chartRef && localChartRef.current) {
      chartRef.current = localChartRef.current.querySelector('canvas');
    }
  }, [chartRef]);
  let chart;
  if (chartType === 'doughnut') {
    chart = (
      <Doughnut
        data={{
          labels: days,
          datasets: [{
            data: data,
            backgroundColor: ['#f06340','#4ade80','#3b82f6','#60a5fa','#fb923c','#a78bfa','#f472b6'],
            borderWidth: 2,
          }],
        }}
        options={{ cutout: '70%', plugins: { legend: { display: false } } }}
      />
    );
  } else if (chartType === 'radar') {
    chart = (
      <Radar
        data={{
          labels: days,
          datasets: data.map((serie, i) => ({
            label: serie.label,
            data: serie.values,
            backgroundColor: serie.color+'33',
            borderColor: serie.color,
            borderWidth: 2,
            pointBackgroundColor: serie.color,
          })),
        }}
        options={{ plugins: { legend: { display: true, labels: { color: '#fff' } } }, scales: { r: { angleLines: { color: '#fff2' }, grid: { color: '#fff2' }, pointLabels: { color: '#fff' }, ticks: { color: '#fff' } } } }}
      />
    );
  } else if (chartType === 'line-multi') {
    // Gráfica NASA: área apilada suave y moderna
    chart = (
      <Line
        data={{
          labels: days,
          datasets: [
            {
              label: data[0]?.label || 'Sistólica',
              data: data[0]?.values || [],
              borderColor: '#f06340',
              backgroundColor: 'rgba(240,99,64,0.18)',
              fill: true,
              tension: 0.45,
              pointRadius: 0,
              borderWidth: 2.5,
              order: 1,
            },
            {
              label: data[1]?.label || 'Diastólica',
              data: data[1]?.values || [],
              borderColor: '#4ade80',
              backgroundColor: 'rgba(74,222,128,0.18)',
              fill: true,
              tension: 0.45,
              pointRadius: 0,
              borderWidth: 2.5,
              order: 2,
            },
            {
              label: data[2]?.label || 'Pulso',
              data: data[2]?.values || [],
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59,130,246,0.13)',
              fill: true,
              tension: 0.45,
              pointRadius: 0,
              borderWidth: 2.5,
              order: 3,
            },
          ],
        }}
        options={{
          plugins: {
            legend: {
              display: true,
              labels: { color: '#fff', font: { size: 13 }, boxWidth: 18, boxHeight: 18, padding: 18 },
              position: 'bottom',
            },
            tooltip: { enabled: true },
          },
          elements: { line: { borderJoinStyle: 'round' } },
          scales: {
            x: {
              ticks: { color: '#fff', font: { size: 13 } },
              grid: { color: '#fff1' },
            },
            y: {
              ticks: { color: '#fff', font: { size: 13 } },
              grid: { color: '#fff1' },
              beginAtZero: false,
            },
          },
        }}
      />
    );
  } else if (chartType === 'line') {
    chart = (
      <Line
        data={{
          labels: days,
          datasets: [
            {
              label: title,
              data: data,
              borderColor: '#60a5fa',
              backgroundColor: 'rgba(96,165,250,0.2)',
              tension: 0.4,
              fill: true,
              pointRadius: 4,
              pointBackgroundColor: '#f06340',
            },
          ],
        }}
        options={{ plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#fff' } }, y: { ticks: { color: '#fff' } } } }}
      />
    );
  } else if (chartType === 'bar') {
    chart = (
      <Bar
        data={{
          labels: days,
          datasets: [
            {
              label: title,
              data: data,
              backgroundColor: '#f06340',
              borderRadius: 8,
              barPercentage: 0.7,
            },
          ],
        }}
        options={{ plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#fff' } }, y: { ticks: { color: '#fff' } } } }}
      />
    );
  } else if (chartType === 'gauge') {
    // Gráfica de alertas: barras apiladas verde/amarillo/rojo
    // data = [{ label: 'Verde', values: [...] }, { label: 'Amarillo', values: [...] }, { label: 'Rojo', values: [...] }]
    chart = (
      <Bar
        data={{
          labels: days,
          datasets: [
            {
              label: 'Alertas verdes',
              data: data[0]?.values || [],
              backgroundColor: '#4ade80',
              stack: 'alertas',
              borderRadius: 6,
            },
            {
              label: 'Alertas amarillas',
              data: data[1]?.values || [],
              backgroundColor: '#facc15',
              stack: 'alertas',
              borderRadius: 6,
            },
            {
              label: 'Alertas rojas',
              data: data[2]?.values || [],
              backgroundColor: '#f06340',
              stack: 'alertas',
              borderRadius: 6,
            },
          ],
        }}
        options={{
          plugins: {
            legend: { display: true, labels: { color: '#fff', font: { size: 12 } } },
            tooltip: { enabled: true },
          },
          scales: {
            x: { stacked: true, ticks: { color: '#fff', font: { size: 11 } }, grid: { color: '#fff1' } },
            y: { stacked: true, ticks: { color: '#fff', font: { size: 11 } }, grid: { color: '#fff1' }, beginAtZero: true },
          },
        }}
      />
    );
  } else {
    // Default: area/line
    chart = (
      <Line
        data={{
          labels: days,
          datasets: [
            {
              label: title,
              data: data,
              borderColor: '#f06340',
              backgroundColor: 'rgba(240,99,64,0.2)',
              tension: 0.4,
              fill: true,
              pointRadius: 4,
              pointBackgroundColor: '#60a5fa',
            },
          ],
        }}
        options={{ plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#fff' } }, y: { ticks: { color: '#fff' } } } }}
      />
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card shadow-xl border border-vita-orange/30 rounded-2xl overflow-hidden"
      ref={localChartRef}
    >
      <Card className="bg-gradient-to-br from-vita-blue-light/80 to-vita-blue-dark/80">
        <CardContent className="p-6 flex flex-col gap-3">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="text-lg font-bold text-vita-white drop-shadow">{title}</h3>
              {subtitle && <p className="text-xs text-vita-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <button
              onClick={onDownloadPDF}
              className="px-3 py-1 bg-vita-orange/80 hover:bg-vita-orange text-white rounded-lg text-xs font-semibold shadow"
            >
              Descargar PDF
            </button>
          </div>
          <div className="w-full h-40 flex items-center justify-center bg-black/10 rounded-xl p-2">
            {chart}
          </div>
          {/* Nota de autolimpieza */}
          <div className="mt-2 text-[10px] text-vita-muted-foreground italic">
            * Este registro se eliminará automáticamente después de 7 días.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NASAHistoryCard;
