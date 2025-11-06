import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import VitaCard365Logo from '../components/Vita365Logo';
import { useToast } from '../components/ui/use-toast';
import { ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const APP_SCHEME = 'vitacard365://auth/recovery';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: APP_SCHEME,
      });
      if (error) {
        // No revelamos si existe/no existe el correo
        console.error(error);
      }
      toast({
        title: '¡Listo!',
        description: 'Si tu correo está registrado, te enviamos instrucciones para recuperar tu contraseña.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Recuperar Contraseña - VitaCard 365</title>
        <meta name="description" content="Recupera el acceso a tu cuenta VitaCard 365 ingresando tu correo electrónico." />
      </Helmet>
      <div className="min-h-screen bg-deep-blue-gradient flex flex-col p-6 relative overflow-hidden">
        <header className="w-full max-w-7xl mx-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/login')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </header>
        <div className="flex-1 flex items-center justify-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="glass-card rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="text-center mb-8">
                <VitaCard365Logo className="h-40 mx-auto mb-6" />
                <h2 className="text-2xl md:text-3xl font-bold text-white">Recuperar Contraseña</h2>
                <p className="text-white/70 mt-2">Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-vita-orange text-white font-bold text-base"
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar instrucciones'}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
