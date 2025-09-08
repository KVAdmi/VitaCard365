import React from 'react';
import { useToast } from '../../components/ui/use-toast';
import MeasureLayout from '../../components/michequeo/MeasureLayout';

const MeasureTriage = () => {
    const { toast } = useToast();
    toast({
        title: '🚧 Módulo en construcción',
        description: 'Puedes solicitar esta función en tu próximo prompt.',
    });
  return (
    <MeasureLayout
      title="Síntomas / Triage Rápido"
      subtitle="Ansiedad, pánico, dolor torácico: te orientamos en 1 minuto."
    >
      <div className="text-center p-8 glass-card rounded-2xl">
        <h2 className="text-xl font-semibold text-white">Próximamente</h2>
        <p className="text-vita-muted-foreground mt-2">Este módulo está en desarrollo.</p>
      </div>
    </MeasureLayout>
  );
};

export default MeasureTriage;