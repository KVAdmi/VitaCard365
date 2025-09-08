import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, Sparkles, Heart, FileText } from 'lucide-react';

const planFeatures = {
  individual: [
    { text: 'Todas las coberturas Vita365' },
    { text: 'Agenda personal' },
    { text: 'Mi Chequeo' },
    { text: 'Bienestar y rutinas' },
  ],
  familiar: [
    { text: 'Todo lo del plan Individual, más:' },
    { text: 'Cobertura para múltiples miembros' },
    { text: 'Descuentos por volumen' },
    { text: 'Gestión centralizada de la familia' },
  ],
};

const PlanCard = ({ plan, price, isSelected, onSelect }) => {
  const features = planFeatures[plan];

  return (
    <Card
      className={`cursor-pointer h-full flex flex-col transition-all duration-300 ${isSelected ? 'border-2 border-vita-orange shadow-lg shadow-vita-orange/20' : 'border-white/20'}`}
      onClick={onSelect}
    >
      <CardHeader className="text-center">
        <CardTitle className="text-3xl capitalize">{plan}</CardTitle>
        <CardDescription>
          <span className="text-4xl font-bold text-vita-white">${price}</span>
          <span className="text-lg text-vita-muted-foreground"> MXN/mes</span>
        </CardDescription>
        {plan === 'familiar' && <p className="text-sm text-green-400">por miembro, con descuentos</p>}
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <ul className="space-y-3 text-left my-6 flex-grow">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-vita-orange mr-2 mt-1 shrink-0" />
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
        <Button
          variant={isSelected ? 'default' : 'outline'}
          className="w-full mt-auto"
        >
          {isSelected ? 'Plan Seleccionado' : 'Elegir este plan'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlanCard;