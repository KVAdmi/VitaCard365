import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import Vita365Logo from '@/components/Vita365Logo';
import { ArrowRight } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Bienvenido a Vita365 - Tu Salud 365 Días del Año</title>
        <meta name="description" content="Descubre Vita365, la app que cuida tu salud y bienestar todos los días del año con cobertura médica integral y herramientas de monitoreo." />
      </Helmet>

      <div className="min-h-screen bg-vita-deep-blue flex flex-col justify-center items-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Vita365Logo className="text-6xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Bienvenido a Vita365</h1>
          <p className="text-white/80 text-lg mb-8">
            Tu salud y asistencia, todos los días.
          </p>

          <div className="space-y-4">
             <Button
                onClick={() => navigate('/onboarding')}
                size="lg"
                className="w-full bg-vita-orange hover:bg-vita-orange/90"
              >
                Comenzar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                size="lg"
                className="w-full border-white/50 text-white hover:bg-white/10"
              >
                Ya tengo una cuenta
              </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Welcome;