import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { saveMedicion } from '../../lib/storage';
import { useBLEVitals } from '@/components/BLEConnect';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import CameraPPG from '../../components/michequeo/CameraPPG';
import MeasureLayout from '../../components/michequeo/MeasureLayout';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/use-toast';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Bluetooth, Camera, Edit2, AlertTriangle, Save } from 'lucide-react';
import TriageResult from '../../components/michequeo/TriageResult';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

const ManualEntryTab = ({ onAnalyze }) => {
  const [sistolica, setSistolica] = useState('');
  const [diastolica, setDiastolica] = useState('');
  const [pulsoBpm, setPulsoBpm] = useState('');
  const [spo2, setSpo2] = useState('');
  const { toast } = useToast();

  const onSubmit = (e) => {
    e.preventDefault();
    
    if (!sistolica && !diastolica && !pulsoBpm && !spo2) {
      toast({
        title: 'Sin datos',
        description: 'Ingresa al menos un valor.',
        variant: 'destructive'
      });
      return;
    }

    onAnalyze({
      id: String(Date.now()),
      ts: Date.now(),
      source: 'manual',
      sistolica: Number(sistolica) || undefined,
      diastolica: Number(diastolica) || undefined,
      pulsoBpm: Number(pulsoBpm) || undefined,
      spo2: Number(spo2) || undefined
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const sys = parseInt(sistolica, 10);
    const dia = parseInt(diastolica, 10);
    const hr = parseInt(pulsoBpm, 10);
    const o2 = parseInt(spo2, 10);

    // Validaciones
    if (sistolica && diastolica) {
      if (sys < 80 || sys > 220) {
        toast({ title: 'Valor inválido', description: 'La presión sistólica debe estar entre 80 y 220.', variant: 'destructive' });
        return;
      }
      if (dia < 50 || dia > 130) {
        toast({ title: 'Valor inválido', description: 'La presión diastólica debe estar entre 50 y 130.', variant: 'destructive' });
        return;
      }
    }

    if (pulsoBpm && (hr < 30 || hr > 200)) {
      toast({ title: 'Valor inválido', description: 'El pulso debe estar entre 30 y 200.', variant: 'destructive' });
      return;
    }

    if (spo2 && (o2 < 80 || o2 > 100)) {
      toast({ title: 'Valor inválido', description: 'La SpO2 debe estar entre 80 y 100%.', variant: 'destructive' });
      return;
    }

    const medicion = {
      id: uuid?.() || String(Date.now()),
      ts: Date.now(),
      source: 'manual',
      sistolica: sys || undefined,
      diastolica: dia || undefined,
      pulsoBpm: hr || undefined,
      spo2: o2 || undefined
    };

    if (Object.values(medicion).filter(v => v !== undefined).length <= 3) { // 3 porque id, ts y source siempre están
      toast({ title: 'Sin datos', description: 'Ingresa al menos un valor.', variant: 'destructive' });
      return;
    }

    onAnalyze(medicion);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="sistolica">Presión Arterial (Sist/Diast)</Label>
          <div className="flex items-center gap-2">
            <Input id="sistolica" type="number" inputMode="numeric" placeholder="Ej: 120" value={sistolica} onChange={e => setSistolica(e.target.value)} />
            <span className="text-white">/</span>
            <Input id="diastolica" type="number" inputMode="numeric" placeholder="Ej: 80" value={diastolica} onChange={e => setDiastolica(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="pulsoBpm">Frecuencia Cardíaca (BPM)</Label>
          <Input id="pulsoBpm" type="number" inputMode="numeric" placeholder="Ej: 75" value={pulsoBpm} onChange={e => setPulsoBpm(e.target.value)} />
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
  const { connectBloodPressure, connectHeartRate, isConnecting, supportsBLE } = useBLEVitals();

  const handleBloodPressureConnect = async () => {
    try {
      toast({
        title: 'Conectando...',
        description: 'Buscando tensiómetro compatible.',
      });
      
      await connectBloodPressure();
      
      toast({
        title: 'Tensiómetro conectado ✅',
        description: 'Las mediciones se guardarán automáticamente.',
      });
    } catch (error) {
      let description = 'Error al conectar el dispositivo.';
      
      if (error.message?.includes('cancelled')) {
        description = 'Operación cancelada por el usuario.';
      } else if (error.message?.includes('permission')) {
        description = 'Sin permisos para acceder al Bluetooth ❌';
      } else if (error.message?.includes('service')) {
        description = 'El dispositivo no expone el servicio esperado.';
      }
      
      toast({
        title: 'Error de conexión',
        description,
        variant: 'destructive'
      });
    }
  };

  const handleHeartRateConnect = async () => {
    try {
      toast({
        title: 'Conectando...',
        description: 'Buscando monitor de pulso compatible.',
      });
      
      await connectHeartRate();
      
      toast({
        title: 'Monitor conectado ✅',
        description: 'Las mediciones se guardarán automáticamente.',
      });
    } catch (error) {
      let description = 'Error al conectar el dispositivo.';
      
      if (error.message?.includes('cancelled')) {
        description = 'Operación cancelada por el usuario.';
      } else if (error.message?.includes('permission')) {
        description = 'Sin permisos para acceder al Bluetooth ❌';
      } else if (error.message?.includes('service')) {
        description = 'El dispositivo no expone el servicio esperado.';
      }
      
      toast({
        title: 'Error de conexión',
        description,
        variant: 'destructive'
      });
    }
  };

  if (!supportsBLE) {
    return (
      <Alert variant="warning" className="bg-yellow-500/10 border-yellow-400/50 text-yellow-300">
        <AlertTriangle className="h-4 w-4 text-yellow-400" />
        <AlertTitle className="text-yellow-400">Bluetooth no disponible</AlertTitle>
        <AlertDescription>
          Tu dispositivo o navegador no soporta Web Bluetooth. Usa Chrome/Edge en Windows, macOS, Android o Linux.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center p-8 glass-card rounded-2xl">
        <Bluetooth className="mx-auto h-12 w-12 text-blue-400 mb-4" />
        <h3 className="text-xl font-semibold text-white">Conexión Bluetooth</h3>
        <p className="text-white mt-2 mb-6">Conecta tus dispositivos compatibles para una medición automática y precisa.</p>
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full border-blue-400 text-blue-400 hover:bg-blue-400/10 hover:text-blue-400" 
            onClick={handleBloodPressureConnect}
            disabled={isConnecting}
          >
            {isConnecting ? 'Conectando...' : 'Conectar Tensiómetro'}
          </Button>
          <Button 
            variant="outline" 
            className="w-full border-blue-400 text-blue-400 hover:bg-blue-400/10 hover:text-blue-400" 
            onClick={handleHeartRateConnect}
            disabled={isConnecting}
          >
            {isConnecting ? 'Conectando...' : 'Conectar Monitor de Pulso'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const PpgCameraTab = () => {
  return (
    <div className="space-y-4">
       <Alert variant="destructive" className="bg-yellow-500/10 border-yellow-400/50 text-yellow-300">
        <AlertTriangle className="h-4 w-4 text-yellow-400" />
        <AlertTitle className="text-yellow-400">Función Beta</AlertTitle>
        <AlertDescription>
          La medición de pulso por cámara es experimental y no debe usarse para diagnóstico médico.
        </AlertDescription>
      </Alert>
      <div className="p-4">
        <p className="text-white/80 mb-3">
          Coloca el dedo sobre la cámara trasera (cubre también el flash) y mantén inmóvil.
        </p>
        <CameraPPG
          sampleSeconds={30}
          autoTorch
          onSaved={(bpm) => console.log("PPG guardado:", bpm)}
        />
      </div>
    </div>
  );
};


const MeasureVitals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [measurements, setMeasurements] = useLocalStorage('vita-measurements', []);
  const [triageResult, setTriageResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (medicion) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("mediciones")
        .insert([{
          usuario_id: user.id,         // UUID del usuario autenticado
          ts: new Date().toISOString(),
          source: 'manual',
          sistolica: medicion.sistolica ? parseInt(medicion.sistolica) : null,
          diastolica: medicion.diastolica ? parseInt(medicion.diastolica) : null,
          pulso_bpm: medicion.pulsoBpm ? parseInt(medicion.pulsoBpm) : null,
          spo2: medicion.spo2 ? parseFloat(medicion.spo2) : null
        }]);

      if (error) {
        console.error("Error guardando medición:", error);
        toast({
          title: 'Error al guardar',
          description: 'No se pudo guardar la medición en la base de datos.',
          variant: 'destructive'
        });
        return false;
      }
      
      // También guardamos en localStorage para acceso offline
      saveMedicion(medicion);
      return true;
    } catch (error) {
      console.error("Error en la operación:", error);
      toast({
        title: 'Error de conexión',
        description: 'Hubo un problema al conectar con el servidor.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async (medicion) => {
    // Primero guardamos en Supabase
    const savedOk = await handleSave(medicion);
    if (!savedOk) return;
    
    // Calcular triage básico
    const triage = {
      riesgo: 'bajo',
      recomendaciones: []
    };
    
    if (medicion.sistolica && medicion.diastolica) {
      if (medicion.sistolica >= 140 || medicion.diastolica >= 90) {
        triage.riesgo = 'medio';
        triage.recomendaciones.push('Presión arterial elevada. Considere consultar a su médico.');
      }
      if (medicion.sistolica >= 180 || medicion.diastolica >= 110) {
        triage.riesgo = 'alto';
        triage.recomendaciones.push('Presión arterial muy elevada. Busque atención médica.');
      }
    }

    if (medicion.pulsoBpm && (medicion.pulsoBpm < 50 || medicion.pulsoBpm > 120)) {
      triage.riesgo = triage.riesgo === 'bajo' ? 'medio' : triage.riesgo;
      triage.recomendaciones.push('Frecuencia cardíaca fuera de rango normal.');
    }

    setTriageResult(triage);

    toast({
      title: 'Medición guardada',
      description: 'Se agregó a tu historial.',
    });
  };

  return (
    <MeasureLayout
      title="Signos Vitales"
      subtitle="Conecta, mide con tu cámara o ingresa los valores manualmente."
    >
      <div className="space-y-6">
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual"><Edit2 className="h-4 w-4 mr-2"/> Manual</TabsTrigger>
            <TabsTrigger value="ble"><Bluetooth className="h-4 w-4 mr-2"/> Conectar</TabsTrigger>
            <TabsTrigger value="ppg"><Camera className="h-4 w-4 mr-2"/> Cámara</TabsTrigger>
          </TabsList>
          <TabsContent value="manual">
            <ManualEntryTab onAnalyze={handleAnalyze} />
          </TabsContent>
          <TabsContent value="ble">
            <BleConnectTab />
          </TabsContent>
          <TabsContent value="ppg">
            <PpgCameraTab />
          </TabsContent>
        </Tabs>

        <AnimatePresence>
          {triageResult?.riesgo && (
              <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
              >
                  <TriageResult {...triageResult} />
                  <Button 
                      onClick={() => navigate('/mi-chequeo/history')} 
                      size="lg" 
                      className="w-full bg-vita-orange hover:bg-vita-orange/90"
                      disabled={saving}
                  >
                      <Save className="mr-2 h-5 w-5" />
                      {saving ? 'Guardando...' : 'Ver mi historial'}
                  </Button>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MeasureLayout>
  );
};

export default MeasureVitals;