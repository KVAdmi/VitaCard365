import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import MeasureLayout from '@/components/michequeo/MeasureLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { triageTests, evaluateTest, getLevelCopy, levelCopy } from '@/lib/triageEngine';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { Siren, Building, Stethoscope, Sparkles, AlertTriangle, ChevronDown, Play, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const LegalDisclaimerCard = () => (
    <Card className="mb-4 bg-yellow-500/10 border-yellow-500/30">
        <CardContent className="p-4 flex items-center space-x-4">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
            <div>
                <CardTitle className="text-sm text-yellow-300">Aviso Importante</CardTitle>
                <CardDescription className="text-xs text-white/80">
                    Estas recomendaciones no sustituyen una valoración médica. Si te sientes en peligro, usa Ambulancia.
                </CardDescription>
            </div>
        </CardContent>
    </Card>
);

const TriageResultCard = ({ result, test, onReset, onSave }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAction = () => {
    const route = test.cta[result.level]?.route;
    if (!route) {
      toast({ title: 'Acción no definida', description: 'No hay una ruta configurada para esta acción.' });
      return;
    }
    
    switch (result.level) {
      case 'A':
        toast({ title: 'Iniciando llamada de emergencia', description: 'Se abrirá la aplicación de teléfono.', variant: 'destructive', duration: 5000 });
        window.location.href = 'tel:5593373553';
        break;
      case 'B':
        toast({ title: 'Mostrando mapa de urgencias...', description: 'Esta acción es una simulación.' });
        break;
      case 'C':
        navigate('/agenda');
        break;
      case 'D':
         toast({ title: 'Mostrando plan de autocuidado...', description: 'Esta acción es una simulación.' });
        break;
      default:
        toast({ title: 'Función no implementada', description: `La ruta es ${route}.` });
    }
  };

  const levelConfig = {
    A: {
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500',
      textColor: 'text-red-400',
      icon: Siren,
      iconText: '🚨',
      title: "Ambulancia inmediata"
    },
    B: {
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-400',
      icon: Building,
      iconText: '🏥',
      title: "Urgencias hoy"
    },
    C: {
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-400',
      icon: Stethoscope,
      iconText: '🩺',
      title: "Consulta 24–72 h"
    },
    D: {
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500',
      textColor: 'text-green-400',
      icon: Sparkles,
      iconText: '🌿',
      title: "Autocuidado"
    },
  };
  
  const config = levelConfig[result.level];
  const ActionIcon = config.icon;
  const copy = getLevelCopy(result.level);

  return (
    <>
      <LegalDisclaimerCard />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-6 rounded-2xl ${config.bgColor} border-2 ${config.borderColor}`}
      >
        <div className="text-center">
          <ActionIcon className={`mx-auto h-12 w-12 ${config.textColor} mb-4`} />
          <h3 className={`text-xl font-bold ${config.textColor}`}>{config.title}</h3>
          <p className="text-white mt-2 mb-4">{copy.recommendation}</p>
          <div className="space-y-3">
            <Button onClick={handleAction} size="lg" className="w-full bg-vita-orange">
              <span className="mr-2">{config.iconText}</span>
              {test.cta[result.level]?.label}
            </Button>
            <Button onClick={onSave} size="lg" variant="secondary" className="w-full">
              <Save className="mr-2 h-4 w-4"/> Guardar en Historial
            </Button>
            <Button onClick={onReset} variant="ghost" className="w-full text-vita-muted-foreground">
              Evaluar otro síntoma
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
};


const TestRunner = ({ test, onComplete, onCancel }) => {
  const [answers, setAnswers] = useState({});

  const handleFieldChange = (fieldId, value) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = evaluateTest(test, answers);
    onComplete(result, answers);
  };
  
  return (
     <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="pt-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-white">{test.title}</h2>
              {test.fields.map(field => (
                  <div key={field.id} className="space-y-3">
                      <Label htmlFor={field.id} className="text-white text-lg">{field.label}</Label>
                      {field.type === 'bool' && (
                          <div className="grid grid-cols-2 gap-3">
                              <Button type="button" variant={answers[field.id] === true ? 'default' : 'outline'} onClick={() => handleFieldChange(field.id, true)}>Sí</Button>
                              <Button type="button" variant={answers[field.id] === false ? 'default' : 'outline'} onClick={() => handleFieldChange(field.id, false)}>No</Button>
                          </div>
                      )}
                      {field.type === 'number' && (
                          <div className="relative">
                              <Input
                                  id={field.id}
                                  type="number"
                                  inputMode="decimal"
                                  placeholder={`Ej: ${field.id === 'onset_min' ? '15' : '120'}`}
                                  value={answers[field.id] || ''}
                                  onChange={e => handleFieldChange(field.id, e.target.value ? parseFloat(e.target.value) : undefined)}
                                  className="pr-12"
                              />
                              {field.unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-vita-muted-foreground">{field.unit}</span>}
                          </div>
                      )}
                      {field.type === 'choice' && (
                          <div className="grid grid-cols-2 gap-3">
                              {field.options.map(option => (
                                  <Button
                                      key={option}
                                      type="button"
                                      variant={answers[field.id] === option ? 'default' : 'outline'}
                                      onClick={() => handleFieldChange(field.id, option)}
                                      className="capitalize"
                                  >
                                      {option}
                                  </Button>
                              ))}
                          </div>
                      )}
                  </div>
              ))}
               <Button type="submit" size="lg" className="w-full bg-vita-orange">Ver recomendación</Button>
               <Button onClick={onCancel} variant="link" className="mt-4 w-full">Cancelar</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

const TestCard = ({ test, onStartTest, isExpanded }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <test.icon className="h-8 w-8 text-vita-orange flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold text-white">{test.title}</h3>
            <p className="text-xs text-white/70 mt-1">{test.description}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={onStartTest} variant="secondary">
            {isExpanded ? 'Cerrar' : 'Iniciar Test'}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="ml-2"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const TestAlerts = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState(null);
  const { user } = useAuth();
  const [triageEvents, setTriageEvents] = useLocalStorage('vita-triage_events', []);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleTestToggle = (testId) => {
    if (result) {
        setResult(null);
        setActiveTest(testId);
    } else {
        setActiveTest(activeTest === testId ? null : testId);
    }
  };

  const handleComplete = (evaluationResult, submittedAnswers) => {
    setResult({ ...evaluationResult, testId: activeTest });
    setAnswers(submittedAnswers);
    setActiveTest(null);
  };

  const handleSave = () => {
    if (!result) return;
    const newEvent = {
      id: uuidv4(),
      user_id: user?.id,
      test_id: result.testId,
      answers,
      level: result.level,
      rationale: result.rationale,
      advice: getLevelCopy(result.level).title,
      created_at: new Date().toISOString(),
    };
    setTriageEvents(prev => [...prev, newEvent]);
    toast({
      title: "Test Guardado",
      description: `El resultado ha sido guardado en tu historial.`,
    });
    navigate('/mi-chequeo');
  };

  const resetAll = () => {
    setActiveTest(null);
    setResult(null);
    setAnswers(null);
  };
  
  const handleCancelTest = () => {
    setActiveTest(null);
  };

  const handleAmbulanceClick = () => {
    toast({ 
        title: 'Iniciando llamada de emergencia', 
        description: 'Se abrirá la aplicación de teléfono para llamar a emergencias.', 
        variant: 'destructive', 
        duration: 5000 
    });
    window.location.href = 'tel:5593373553';
  };

  return (
    <MeasureLayout
      title="Test de Alertas"
      subtitle="Evalúa tus síntomas para obtener una recomendación de acción."
    >
      <div className="space-y-6 pb-20">
         <Button onClick={handleAmbulanceClick} variant="destructive" size="lg" className="w-full mb-6 h-auto py-5 text-xl font-bold">
            <Siren className="mr-4 h-8 w-8 animate-pulse text-red-500" />
            Pedir ambulancia
        </Button>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result">
              <TriageResultCard result={result} test={triageTests[result.testId]} onReset={resetAll} onSave={handleSave}/>
            </motion.div>
          ) : (
            <motion.div key="selection" className="space-y-4">
              {Object.values(triageTests).map((test) => (
                <div key={test.id}>
                  <TestCard 
                    test={test}
                    onStartTest={() => handleTestToggle(test.id)}
                    isExpanded={activeTest === test.id}
                  />
                  <AnimatePresence>
                    {activeTest === test.id && (
                      <TestRunner
                        test={test}
                        onComplete={handleComplete}
                        onCancel={handleCancelTest}
                      />
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 bg-vita-background/80 backdrop-blur-sm p-3 text-center border-t border-white/10">
        <p className="text-xs text-vita-muted-foreground">
          La orientación es informativa. Si te sientes en riesgo, usa Ambulancia.
        </p>
      </footer>
    </MeasureLayout>
  );
};

export default TestAlerts;