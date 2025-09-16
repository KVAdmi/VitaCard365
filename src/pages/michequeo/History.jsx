import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import MeasureLayout from '../../components/michequeo/MeasureLayout';
import { Card } from '../../components/ui/card';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const History = () => {
  const { user } = useAuth();
  const [mediciones, setMediciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMediciones = async () => {
      try {
        const { data, error } = await supabase
          .from('mediciones')
          .select('*')
          .eq('usuario_id', user.id)
          .order('ts', { ascending: false });

        if (error) throw error;
        setMediciones(data || []);
      } catch (error) {
        console.error('Error cargando mediciones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMediciones();
  }, [user.id]);

  // Preparar datos para las gráficas
  const labels = mediciones.map(m => new Date(m.ts).toLocaleDateString());
  const datasets = [
    {
      label: 'Presión Sistólica',
      data: mediciones.map(m => m.sistolica),
      borderColor: 'rgb(255, 99, 132)',
      tension: 0.1
    },
    {
      label: 'Presión Diastólica',
      data: mediciones.map(m => m.diastolica),
      borderColor: 'rgb(53, 162, 235)',
      tension: 0.1
    },
    {
      label: 'Pulso (BPM)',
      data: mediciones.map(m => m.pulso_bpm),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    },
    {
      label: 'SpO₂',
      data: mediciones.map(m => m.spo2),
      borderColor: 'rgb(153, 102, 255)',
      tension: 0.1
    }
  ].filter(dataset => dataset.data.some(value => value !== null));

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white'
        }
      }
    },
    scales: {
      y: {
        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  return (
    <MeasureLayout
      title="Historial de Signos Vitales"
      subtitle="Seguimiento de tus mediciones a lo largo del tiempo"
    >
      <div className="space-y-6">
        {loading ? (
          <Card className="p-6">
            <p className="text-center text-white/70">Cargando mediciones...</p>
          </Card>
        ) : mediciones.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-white/70">No hay mediciones registradas aún.</p>
          </Card>
        ) : (
          <>
            <Card className="p-6">
              <Line options={chartOptions} data={{ labels, datasets }} />
            </Card>

            <div className="space-y-4">
              {mediciones.map((medicion) => (
                <Card key={medicion.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-white/70">
                      <span>{new Date(medicion.ts).toLocaleDateString()}</span>
                      <span>{new Date(medicion.ts).toLocaleTimeString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {medicion.sistolica && medicion.diastolica && (
                        <div>
                          <span className="text-sm text-white/70">Presión Arterial</span>
                          <p className="text-xl font-bold text-white">
                            {medicion.sistolica}/{medicion.diastolica}
                          </p>
                        </div>
                      )}
                      {medicion.pulso_bpm && (
                        <div>
                          <span className="text-sm text-white/70">Pulso</span>
                          <p className="text-xl font-bold text-white">
                            {medicion.pulso_bpm} <span className="text-sm font-normal">bpm</span>
                          </p>
                        </div>
                      )}
                      {medicion.spo2 && (
                        <div>
                          <span className="text-sm text-white/70">SpO₂</span>
                          <p className="text-xl font-bold text-white">
                            {medicion.spo2}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </MeasureLayout>
  );
};

export default History;