import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import MeasureLayout from '../../components/michequeo/MeasureLayout';
import TriageResult from '../../components/michequeo/TriageResult';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/use-toast';
import { runTriage } from '../../lib/triageRules';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Bluetooth, Save, Camera, Edit2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import PPGCameraHR from '../../modules/mi-chequeo/PPGCameraHR';

const ManualEntryTab = ({ onAnalysis }) => {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);
    const hr = parseInt(heartRate, 10);

    if (sys < 80 || sys > 220) {
      toast({ title: 'Valor inválido', description: 'La presión sistólica debe estar entre 80 y 220.', variant: 'destructive' });
      return;
    }
    if (dia < 50 || dia > 130) {
      toast({ title: 'Valor inválido', description: 'La presión diastólica debe estar entre 50 y 130.', variant: 'destructive' });
      return;
    }
    if (hr < 30 || hr > 200) {
      toast({ title: 'Valor inválido', description: 'El pulso debe estar entre 30 y 200.', variant: 'destructive' });
      return;
    }

    onAnalysis({
      systolic: sys,
      diastolic: dia,
      heartRate: hr,
      source: 'manual'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="systolic">Sistólica (mmHg)</Label>
          <Input id="systolic" type="number" inputMode="numeric" placeholder="Ej: 120" value={systolic} onChange={e => setSystolic(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="diastolic">Diastólica (mmHg)</Label>
          <Input id="diastolic" type="number" inputMode="numeric" placeholder="Ej: 80" value={diastolic} onChange={e => setDiastolic(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="heartRate">Pulso (BPM)</Label>
          <Input id="heartRate" type="number" inputMode="numeric" placeholder="Ej: 75" value={heartRate} onChange={e => setHeartRate(e.target.value)} required />
        </div>
      </div>
      <Button type="submit" size="lg" className="w-full bg-vita-orange">Analizar Medición</Button>
    </form>
  );
};

const BleConnectTab = () => {
  const { toast } = useToast();
  const handleNotImplemented = () => {
    toast({
      title: '🚧 Función no implementada',
      description: 'La conexión con tensiómetros Bluetooth estará disponible próximamente.',
    });
  };

  return (
    <div className="text-center p-8 glass-card rounded-2xl">
      <Bluetooth className="mx-auto h-12 w-12 text-blue-400 mb-4" />
      <h3 className="text-xl font-semibold text-white">Conexión Bluetooth</h3>
      <p className="text-white mt-2 mb-6">Conecta tu tensiómetro compatible para una medición automática y precisa.</p>
      <Button variant="outline" className="w-full border-blue-400 text-blue-400 hover:bg-blue-400/10 hover:text-blue-400" onClick={handleNotImplemented}>
        Buscar Dispositivos
      </Button>
    </div>
  );
};

const PpgCameraTab = () => {
  const { toast } = useToast();
  const handleNotImplemented = () => {
    toast({
      title: '🚧 Función no implementada',
      description: 'La medición con cámara estará disponible próximamente.',
    });
  };

  return (
    <div className="space-y-4">
       <Alert variant="destructive" className="bg-yellow-500/10 border-yellow-400/50 text-yellow-300">
        <AlertTriangle className="h-4 w-4 text-yellow-400" />
        <AlertTitle className="text-yellow-400">Función Beta</AlertTitle>
        <AlertDescription>
          La medición de pulso y presión estimada con la cámara es experimental y no debe usarse para diagnóstico.
        </AlertDescription>
      </Alert>
      <div className="text-center p-8 glass-card rounded-2xl">
        <Camera className="mx-auto h-12 w-12 text-green-400 mb-4" />
        <h3 className="text-xl font-semibold text-white">Medir con Cámara</h3>
        <p className="text-white mt-2 mb-6">Usa la cámara trasera de tu teléfono para estimar tu frecuencia cardíaca.</p>
        <Button variant="outline" className="w-full border-green-400 text-green-400 hover:bg-green-400/10 hover:text-green-400" onClick={handleNotImplemented}>
          Iniciar Medición PPG
        </Button>
      </div>
      {/* <PPGCameraHR /> */}
    </div>
  );
};


const MeasurePressure = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [measurements, setMeasurements] = useLocalStorage('vita-measurements', []);
  const [triageResult, setTriageResult] = useState(null);
  const [currentData, setCurrentData] = useState(null);

  const handleAnalysis = (data) => {
    const result = runTriage('pressure', data);
    setTriageResult(result);
    setCurrentData(data);
  };
  
  const handleSave = () => {
    if (!currentData) {
      toast({ title: "Sin datos", description: "Primero analiza una medición para poder guardarla.", variant: 'destructive' });
      return;
    }

    const newMeasurement = {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      type: 'pressure',
      vitals: {
        pressure: `${currentData.systolic}/${currentData.diastolic}`,
        heartRate: currentData.heartRate,
      },
      source: currentData.source,
      triage: triageResult,
    };

    setMeasurements([...measurements, newMeasurement]);
    toast({
      title: '¡Guardado!',
      description: 'Tu medición de presión ha sido guardada en el historial.',
    });
    navigate('/mi-chequeo');
  };

  return (
    <MeasureLayout
      title="Presión Arterial"
      subtitle="Conecta, mide con tu cámara o ingresa los valores manualmente."
    >
      <div className="space-y-6">
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ble"><Bluetooth className="h-4 w-4 mr-2"/> Conectar</TabsTrigger>
            <TabsTrigger value="manual"><Edit2 className="h-4 w-4 mr-2"/> Manual</TabsTrigger>
            <TabsTrigger value="ppg"><Camera className="h-4 w-4 mr-2"/> Cámara</TabsTrigger>
          </TabsList>
          <TabsContent value="ble">
            <BleConnectTab />
          </TabsContent>
          <TabsContent value="manual">
            <ManualEntryTab onAnalysis={handleAnalysis} />
          </TabsContent>
          <TabsContent value="ppg">
            <PpgCameraTab />
          </TabsContent>
        </Tabs>

        <AnimatePresence>
          {triageResult && (
              <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
              >
                  <TriageResult {...triageResult} />
                  <Button onClick={handleSave} size="lg" className="w-full bg-green-500 hover:bg-green-600">
                      <Save className="mr-2 h-5 w-5" />
                      Guardar en mi historial
                  </Button>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
       <footer className="fixed bottom-0 left-0 right-0 bg-vita-background/80 backdrop-blur-sm p-3 text-center border-t border-white/10">
        <p className="text-xs text-white">
          Este módulo no sustituye valoración médica. Para presión arterial, usa un tensiómetro certificado.
        </p>
      </footer>
    </MeasureLayout>
  );
};

export default MeasurePressure;