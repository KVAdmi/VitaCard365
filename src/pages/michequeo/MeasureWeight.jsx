
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
// import { v4 as uuidv4 } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { supabase } from '../../lib/supabaseClient';
import { getOrCreateLocalUserId } from '../../lib/getOrCreateLocalUserId';
import { useToast } from '../../components/ui/use-toast';
import MeasureLayout from '../../components/michequeo/MeasureLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Save, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  // Siempre visible: si no hay BMI aún, mostramos placeholder motivacional
  const has = !(bmi === null || bmi === undefined || isNaN(bmi));

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
      <div className="rounded-2xl bg-white/10 p-4 text-white shadow-xl border border-pink-300/25" style={{boxShadow:'0 0 0 1px rgba(244,114,182,0.28)'}}>
        <style>{`@keyframes neonPulseRose {0%,100%{box-shadow:0 0 0 1px rgba(244,114,182,0.38),0 0 18px rgba(244,114,182,0.18)}50%{box-shadow:0 0 0 1px rgba(244,114,182,0.65),0 0 26px rgba(244,114,182,0.32)}}`}</style>
        <h3 className="text-lg font-semibold mb-2 text-center">Índice de Masa Corporal (IMC)</h3>
        <div className="mt-2 text-center" style={{animation:'neonPulseRose 2.6s ease-in-out infinite'}}>
          <div className="text-5xl font-extrabold">{has ? bmi.toFixed(1) : '—'}</div>
          {has && <div className={`mt-1 text-xl font-bold ${getBmiColor(bmi)}`}>{label}</div>}
          <p className="mt-2 text-xs text-white/90">
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

  const handleSaveWeight = async () => {
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

    // Guardar en Supabase
    // Usa el usuario_id real del usuario logueado si está disponible
    let usuario_id = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      usuario_id = user?.id || getOrCreateLocalUserId();
    } catch {
      usuario_id = getOrCreateLocalUserId();
    }
    const payload = {
      usuario_id,
      peso_kg: weightValue,
      tipo: 'peso',
      source: 'manual',
      ts: new Date().toISOString(),
    };
    const { error } = await supabase.from('mediciones').insert([payload]);
    if (error) {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
      return;
    }
    // Refrescar estado local para ver el cambio inmediatamente
    setWeightHistory(prev => [...prev, payload]);
    setCurrentWeight('');
    toast({
      title: '¡Guardado en la nube!',
      description: `Se ha registrado un peso de ${weightValue} kg.`,
    });
  };

  // Leer historial real de Supabase
  const [weightHistory, setWeightHistory] = useState([]);
  useEffect(() => {
    async function fetchWeight() {
      let usuario_id = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        usuario_id = user?.id || getOrCreateLocalUserId();
      } catch {
        usuario_id = getOrCreateLocalUserId();
      }
      const { data, error } = await supabase
        .from('mediciones')
        .select('*')
        .eq('usuario_id', usuario_id)
        .eq('tipo', 'peso')
        .order('ts', { ascending: true });
      if (!error && data) setWeightHistory(data);
    }
    fetchWeight();
  }, []);


  const chartData = {
    labels: weightHistory.map(entry => new Date(entry.ts).toLocaleDateString('es-ES')),
    datasets: [
      {
        label: 'Peso (kg)',
        data: weightHistory.map(entry => entry.peso_kg),
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

        <BMICard bmi={displayedBmi} />

        {/* Mensajes motivacionales con rosa palo */}
        <div className="rounded-2xl border border-pink-300/25 bg-white/10 p-4 text-white" style={{boxShadow:'0 0 0 1px rgba(244,114,182,0.28)'}}>
          <motion.p initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="text-center text-sm">
            Pensamos en ti y en nosotros: juntos crearemos nuestra mejor versión en equilibrio.
          </motion.p>
        </div>

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

        {/* Recordatorio de coberturas: Nutriólogo 24/7 */}
        <div className="rounded-2xl border border-pink-300/20 bg-white/10 p-4 text-white shadow" style={{boxShadow:'0 0 0 1px rgba(244,114,182,0.22)'}}>
          <div className="text-sm font-semibold mb-1">Acompañamiento 24/7</div>
          <p className="text-sm text-white/90">En tu cobertura cuentas con Nutriólogo 24/7. Da el primer paso: agenda una charla y diseñemos tu plan alimenticio.</p>
          <div className="mt-2">
            <Link to="/coberturas?cat=fitness#asistencia-fitness" className="px-3 py-1 rounded-xl border border-pink-300/30 bg-pink-400/10 hover:bg-pink-400/20 text-pink-100">Hablar con un experto</Link>
          </div>
        </div>
      </div>
    </MeasureLayout>
  );
};

export default MeasureWeight;
