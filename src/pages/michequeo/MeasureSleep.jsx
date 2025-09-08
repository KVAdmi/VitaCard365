import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../../components/ui/use-toast';
import MeasureLayout from '../../components/michequeo/MeasureLayout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Play, StopCircle, Mic, AlertCircle, Save, FileDown, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SleepMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [summary, setSummary] = useState(null);
  const timerRef = useRef(null);

  const startMonitoring = () => {
    setIsMonitoring(true);
    setSummary(null);
    setElapsedTime(0);
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    clearInterval(timerRef.current);
    generateSummary();
  };

  const generateSummary = () => {
    const duration = Math.floor(elapsedTime / 60);
    if (duration < 1) {
      setSummary(null);
      return;
    }
    const snorePercent = Math.floor(Math.random() * 30);
    const score = 100 - snorePercent - Math.floor(Math.random() * 10);
    setSummary({
      id: uuidv4(),
      date: new Date().toISOString(),
      duracion_monitorizada: duration,
      '%_ronquido': snorePercent,
      eventos_voz: Math.floor(Math.random() * 5),
      picos_ruido: Math.floor(Math.random() * 20),
      score_sueno: score < 0 ? 0 : score,
    });
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          {isMonitoring ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
              <div className="text-6xl font-bold text-vita-orange tabular-nums">{formatTime(elapsedTime)}</div>
              <div className="flex items-center justify-center space-x-2 text-green-400">
                <Mic className="animate-pulse" />
                <span>Monitoreando...</span>
              </div>
              <Button onClick={stopMonitoring} size="lg" className="w-full bg-red-500 hover:bg-red-600">
                <StopCircle className="mr-2 h-5 w-5" />
                Detener
              </Button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
               <div className="text-6xl font-bold text-white tabular-nums">{formatTime(elapsedTime)}</div>
              <p className="text-white/70">Listo para iniciar el monitoreo</p>
              <Button onClick={startMonitoring} size="lg" className="w-full bg-vita-orange">
                <Play className="mr-2 h-5 w-5" />
                Iniciar Monitoreo
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
      {summary && <SleepSummary summary={summary} clearSummary={() => setSummary(null)} />}
    </div>
  );
};

const SleepSummary = ({ summary, clearSummary }) => {
  const [sleepHistory, setSleepHistory] = useLocalStorage('vita-sleep-history', []);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSave = () => {
    const newHistory = [summary, ...sleepHistory];
    setSleepHistory(newHistory);
    toast({ title: 'Resumen guardado', description: 'Tu sesión de sueño se ha guardado en el historial.' });
    navigate('/mi-chequeo');
  };

  const handleDelete = () => {
    clearSummary();
    toast({ title: 'Resumen descartado', variant: 'destructive' });
  };
  
  const handleNotImplemented = () => {
    toast({
      title: '🚧 Función no implementada',
      description: 'La descarga de PDF estará disponible próximamente.',
    });
  };

  const getStatus = (score) => {
    if (score > 85) return { text: 'Excelente', color: 'text-green-400' };
    if (score > 70) return { text: 'Bueno', color: 'text-yellow-400' };
    return { text: 'Necesita mejorar', color: 'text-red-400' };
  }
  
  const status = getStatus(summary.score_sueno);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle>Resumen de la Sesión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`text-6xl font-bold ${status.color}`}>{summary.score_sueno}</div>
            <p className={`text-lg font-semibold ${status.color}`}>{status.text}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="glass-card p-3 rounded-lg">
              <p className="text-sm text-white">Duración</p>
              <p className="text-xl font-bold text-white">{summary.duracion_monitorizada} min</p>
            </div>
            <div className="glass-card p-3 rounded-lg">
              <p className="text-sm text-white">% Ronquido</p>
              <p className="text-xl font-bold text-white">{summary['%_ronquido']}%</p>
            </div>
            <div className="glass-card p-3 rounded-lg">
              <p className="text-sm text-white">Eventos de voz</p>
              <p className="text-xl font-bold text-white">{summary.eventos_voz}</p>
            </div>
             <div className="glass-card p-3 rounded-lg">
              <p className="text-sm text-white">Picos de ruido</p>
              <p className="text-xl font-bold text-white">{summary.picos_ruido}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1 bg-green-500 hover:bg-green-600"><Save className="mr-2 h-4 w-4"/>Guardar</Button>
            <Button onClick={handleNotImplemented} variant="outline" className="flex-1 border-vita-orange text-vita-orange hover:bg-vita-orange/10 hover:text-vita-orange"><FileDown className="mr-2 h-4 w-4"/>PDF</Button>
            <Button onClick={handleDelete} variant="destructive" className="flex-1"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const MeasureSleep = () => {
  return (
    <MeasureLayout
      title="Salud del Sueño"
      subtitle="Monitorea la calidad de tu descanso nocturno."
    >
      <div className="space-y-6">
        <Alert variant="default" className="bg-white/5 border-vita-orange/50 text-white">
          <AlertCircle className="h-4 w-4 text-vita-orange" />
          <AlertDescription>
            Monitoreo de sueño: los datos se procesan en tu dispositivo. Te recomendamos descargar tus resúmenes con frecuencia. Este módulo no sustituye evaluación clínica.
          </AlertDescription>
        </Alert>
        <SleepMonitor />
      </div>
    </MeasureLayout>
  );
};

export default MeasureSleep;