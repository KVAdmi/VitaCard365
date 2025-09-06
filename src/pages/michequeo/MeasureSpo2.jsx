import React from 'react';
import { useToast } from '@/components/ui/use-toast';
import MeasureLayout from '@/components/michequeo/MeasureLayout';

const MeasureSpo2 = () => {
    const { toast } = useToast();
    toast({
        title: '🚧 Módulo en construcción',
        description: 'Puedes solicitar esta función en tu próximo prompt.',
    });
  return (
    <MeasureLayout
      title="SpO₂ (Oxigenación)"
      subtitle="Registra tu oxigenación."
    >
      <div className="text-center p-8 glass-card rounded-2xl">
        <h2 className="text-xl font-semibold text-white">Próximamente</h2>
        <p className="text-white mt-2">Este módulo está en desarrollo.</p>
      </div>
    </MeasureLayout>
  );
};

export default MeasureSpo2;