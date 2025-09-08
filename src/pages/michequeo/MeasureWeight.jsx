
import React, { useState, useMemo, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { v4 as uuidv4 } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../../components/ui/use-toast';
import MeasureLayout from '../../components/michequeo/MeasureLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Save, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BMIStageAvatar from '../../components/michequeo/BMIStageAvatar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BMICard = ({ bmi }) => {
  if (bmi === null || bmi === undefined || isNaN(bmi)) return null;

  const label =
    bmi < 18.5 ? "Bajo peso" :
    bmi < 25   ? "Normal" :
    bmi < 30   ? "Sobrepeso" : "Obesidad";

  const getBmiColor = (bmiValue) => {
    if (bmiValue < 18.5) return 'text-blue-400';
    if (bmiValue < 24.9) return 'text-green-400';
    if (bmiValue < 29.9) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      <div className="rounded-2xl bg-[#0c1c3e] p-4 text-white shadow-xl border border-vita-orange/20">
        <h3 className="text-lg font-semibold mb-2 text-center">Tu Resultado</h3>
        <p className="text-sm text-white mb-3 text-center">Índice de Masa Corporal (IMC)</p>

        <div className="mt-4 text-center">
          <div className="text-5xl font-extrabold">{bmi.toFixed(1)}</div>
          <div className={`mt-1 text-xl font-bold ${getBmiColor(bmi)}`}>{label}</div>
          <p className="mt-2 text-xs text-white">
            Indicador estimado entre peso y talla. No sustituye una evaluación médica.
          </p>
        </div>
    {/* Imagen flotante eliminada por solicitud del usuario */}
      </div>
    </motion.div>
  );
};


const MeasureWeight = () => {
  const [measurements, setMeasurements] = useLocalStorage('vita-measurements', []);
  const [currentWeight, setCurrentWeight] = useState('');
  const [height, setHeight] = useLocalStorage('vita-user-height', '');
  const [lastBmi, setLastBmi] = useLocalStorage('vita-last-bmi', null);
  const { toast } = useToast();
  
  const bmi = useMemo(() => {
    const weightToUse = currentWeight ? parseFloat(currentWeight) : null;
    const heightInMeters = parseFloat(height) / 100;
    if (weightToUse > 0 && heightInMeters > 0) {
      return weightToUse / (heightInMeters * heightInMeters);
    }
    return null;
  }, [currentWeight, height]);

  useEffect(() => {
    const lastWeightMeasurement = measurements
      .filter(m => m.type === 'weight' && m.vitals.bmi)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (lastWeightMeasurement) {
      setLastBmi(lastWeightMeasurement.vitals.bmi);
    }
  }, [measurements, setLastBmi]);

  const handleSaveWeight = () => {
    const weightValue = parseFloat(currentWeight);
    const heightValue = parseFloat(height);

    if (!heightValue || heightValue <= 0) {
      toast({
        title: 'Falta tu talla',
        description: 'Por favor, introduce tu talla en centímetros.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!weightValue || weightValue <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Por favor, introduce un peso válido.',
        variant: 'destructive',
      });
      return;
    }

    const calculatedBmi = weightValue / ((heightValue / 100) * (heightValue / 100));
    setLastBmi(calculatedBmi);

    const newEntry = {
      id: uuidv4(),
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(),
      type: 'weight',
      vitals: {
        weight: weightValue,
        bmi: calculatedBmi,
      },
      source: 'manual',
    };
    
    setMeasurements([...measurements, newEntry]);
    setCurrentWeight('');
    toast({
      title: '¡Guardado!',
      description: `Se ha registrado un peso de ${weightValue} kg.`,
    });
  };

  const weightHistory = useMemo(() => {
    return measurements
      .filter(m => m.type === 'weight')
      .sort((a,b) => new Date(a.date) - new Date(b.date));
  }, [measurements]);


  const chartData = {
    labels: weightHistory.map(entry => new Date(entry.date).toLocaleDateString('es-ES')),
    datasets: [
      {
        label: 'Peso (kg)',
        data: weightHistory.map(entry => entry.vitals.weight),
        borderColor: '#f06340',
        backgroundColor: 'rgba(240, 99, 64, 0.2)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#f06340',
        pointBorderColor: '#fff',
        pointHoverRadius: 7,
        pointRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      x: {
        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      y: {
        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
    },
  };

  const displayedBmi = bmi !== null ? bmi : lastBmi;

  return (
    <MeasureLayout
      title="Peso y Talla"
      subtitle="Registra tu evolución para un seguimiento de tu salud y dieta."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Registro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="height">Tu Talla (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="Ej: 175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div>
                <Label htmlFor="weight">Peso actual (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="Ej: 75.5"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  inputMode="decimal"
                />
              </div>
            </div>
            <Button onClick={handleSaveWeight} className="w-full bg-vita-orange" disabled={!currentWeight || !height}>
              <Save className="mr-2 h-5 w-5" />
              Guardar Peso
            </Button>
          </CardContent>
        </Card>

        <AnimatePresence>
          {displayedBmi !== null && <BMICard bmi={displayedBmi} />}
        </AnimatePresence>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-vita-orange" />
              Historial de Peso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weightHistory.length > 1 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Line options={chartOptions} data={chartData} />
              </motion.div>
            ) : (
              <div className="text-center py-10">
                <p className="text-white">
                  {weightHistory.length === 1 ? 'Necesitas al menos dos registros para ver la gráfica.' : 'Aún no hay registros de peso.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MeasureLayout>
  );
};

export default MeasureWeight;
