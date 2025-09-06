import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import MeasureLayout from '@/components/michequeo/MeasureLayout';
import TriageResult from '@/components/michequeo/TriageResult';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { runTriage } from '@/lib/triageRules';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Bluetooth, Save, Camera, Edit2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ManualEntryTab = ({ onAnalysis }) => {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [spo2, setSpo2] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);
    const hr = parseInt(heartRate, 10);
    const o2 = parseInt(spo2, 10);

    let data = {};
    let triageType = '';

    if (systolic && diastolic && heartRate) {
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
        data = { ...data, systolic: sys, diastolic: dia, heartRate: hr, type: 'vitals', source: 'manual' };
        triageType = 'pressure';
    }

    if(spo2) {
        if (o2 < 80 || o2 > 100) {
            toast({ title: 'Valor inválido', description: 'La SpO2 debe estar entre 80 y 100%.', variant: 'destructive' });
            return;
        }
        data = { ...data, spo2: o2, type: 'vitals', source: 'manual' };
        if (!triageType) triageType = 'spo2';
    }
    
    if (Object.keys(data).length === 0) {
        toast({ title: 'Sin datos', description: 'Por favor, ingresa al menos un valor.', variant: 'destructive' });
        return;
    }

    onAnalysis(data, triageType);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="systolic">Presión Arterial (Sist/Diast)</Label>
          <div className="flex items-center gap-2">
            <Input id="systolic" type="number" inputMode="numeric" placeholder="Sist." value={systolic} onChange={e => setSystolic(e.target.value)} />
            <span className="text-white">/</span>
            <Input id="diastolic" type="number" inputMode="numeric" placeholder="Diast." value={diastolic} onChange={e => setDiastolic(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="heartRate">Frecuencia Cardíaca (BPM)</Label>
          <Input id="heartRate" type="number" inputMode="numeric" placeholder="Ej: 75" value={heartRate} onChange={e => setHeartRate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="spo2">Oxigenación (SpO₂ %)</Label>
          <Input id="spo2" type="number" inputMode="numeric" placeholder="Ej: 98" value={spo2} onChange={e => setSpo2(e.target.value)} />
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
      description: 'La conexión con dispositivos Bluetooth estará disponible próximamente.',
    });
  };

  return (
    <div className="text-center p-8 glass-card rounded-2xl">
      <Bluetooth className="mx-auto h-12 w-12 text-blue-400 mb-4" />
      <h3 className="text-xl font-semibold text-white">Conexión Bluetooth</h3>
      <p className="text-white mt-2 mb-6">Conecta tus dispositivos compatibles para una medición automática y precisa.</p>
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
    </div>
  );
};


const MeasureVitals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [measurements, setMeasurements] = useLocalStorage('vita-measurements', []);
  const [triageResult, setTriageResult] = useState(null);
  const [currentData, setCurrentData] = useState(null);

  const handleAnalysis = (data, triageType) => {
    const result = runTriage(triageType, data);
    setTriageResult(result);
    setCurrentData(data);
  };
  
  const handleSave = () => {
    if (!currentData) {
      toast({ title: "Sin datos", description: "Primero analiza una medición para poder guardarla.", variant: 'destructive' });
      return;
    }
    
    const vitalsToSave = {};
    if (currentData.systolic && currentData.diastolic) {
        vitalsToSave.pressure = `${currentData.systolic}/${currentData.diastolic}`;
    }
    if (currentData.heartRate) {
        vitalsToSave.heartRate = currentData.heartRate;
    }
    if (currentData.spo2) {
        vitalsToSave.spo2 = currentData.spo2;
    }

    const newMeasurement = {
      id: uuidv4(),
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(),
      type: 'vitals',
      vitals: vitalsToSave,
      source: currentData.source,
      triage: triageResult,
    };

    setMeasurements([...measurements, newMeasurement]);
    toast({
      title: '¡Guardado!',
      description: 'Tus signos vitales han sido guardados en el historial.',
    });
    navigate('/mi-chequeo');
  };

  return (
    <MeasureLayout
      title="Signos Vitales"
      subtitle="Conecta, mide con tu cámara o ingresa los valores manualmente."
    >
      <div className="space-y-6">
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ble"><Bluetooth className="h-4 w-4 mr-2"/> Conectar</TabsTrigger>
            <TabsTrigger value="manual"><Edit2 className="h-4 w-4 mr-2"/> Manual</TabsTrigger>
            <TabsTrigger value="ppg" disabled>
              <Camera className="h-4 w-4 mr-2"/> Cámara
              <span className="text-xs ml-2 text-yellow-400" title="Pronto: sincronizado con wearables compatibles; por ahora usamos Google Fit.">Pronto</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ble">
            <BleConnectTab />
          </TabsContent>
          <TabsContent value="manual">
            <ManualEntryTab onAnalysis={handleAnalysis} />
          </TabsContent>
          <TabsContent value="ppg">
            {/*
              <PpgCameraTab />
            */}
            <div className="p-4 text-yellow-400 text-center text-sm">Pronto: sincronizado con wearables compatibles; por ahora usamos Google Fit.</div>
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
    </MeasureLayout>
  );
};

export default MeasureVitals;