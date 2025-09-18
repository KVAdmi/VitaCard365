import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';

import { Card, CardContent } from '../../components/ui/card';
import { motion } from 'framer-motion';
import { HeartPulse, AlertTriangle, Weight, Moon, ArrowRight } from 'lucide-react';

const NewMeasurement = () => {
  const navigate = useNavigate();

  const measurementOptions = [
    {
      title: 'Signos Vitales',
      description: 'Presión, pulso, SpO₂...',
      icon: HeartPulse,
      path: '/mi-chequeo/vitals',
      color: 'text-red-400',
    },
    {
      title: 'Test de Alertas',
      description: 'Evalúa síntomas específicos.',
      icon: AlertTriangle,
      path: '/mi-chequeo/test-alertas',
      color: 'text-yellow-400',
    },
    {
      title: 'Peso y Talla',
      description: 'Calcula tu IMC y ve tu historial.',
      icon: Weight,
      path: '/mi-chequeo/peso',
      color: 'text-green-400',
    },
    {
      title: 'Calidad del Sueño',
      description: 'Monitorea tus ronquidos.',
      icon: Moon,
      path: '/mi-chequeo/sueno',
      color: 'text-indigo-400',
    },
  ];

  return (
    <Layout title="Mi Chequeo" showBackButton>
      <div className="p-4 md:p-6 space-y-8">
  {/* Aquí iban las tarjetas NASA, ahora solo opciones de nueva medición */}
        {/* Opciones de nueva medición */}
        <div className="space-y-4">
          {measurementOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <motion.div
                key={option.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  className="cursor-pointer hover:border-vita-orange transition-all duration-300"
                  onClick={() => navigate(option.path)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Icon className={`w-8 h-8 ${option.color}`} />
                      <div>
                        <h3 className="text-lg font-bold text-vita-white">{option.title}</h3>
                        <p className="text-sm text-white/80">{option.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-vita-muted-foreground" />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default NewMeasurement;