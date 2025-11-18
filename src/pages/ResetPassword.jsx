import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import VitaCard365Logo from '../components/Vita365Logo';
import { useToast } from '../components/ui/use-toast';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Capacitor } from '@capacitor/core';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Detectar modo: 'send' (enviar email) o 'update' (actualizar contraseña)
  const stage = searchParams.get('stage');
  const isUpdateMode = stage === 'update';
  
  const isNative = Capacitor.isNativePlatform?.();

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Determinar redirectTo según plataforma
      const redirectTo = isNative 
        ? 'vitacard365://auth/recovery' 
        : `${window.location.origin}/auth/callback`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'No se pudo enviar el email de recuperación.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '¡Listo!',
          description: 'Si tu correo está registrado, recibirás instrucciones para recuperar tu contraseña.',
        });
        // Limpiar el formulario
        setEmail('');
      }
    } catch (err) {
      console.error('Error sending reset email:', err);
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado. Por favor intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validar longitud mínima
    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'No se pudo actualizar la contraseña.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '¡Contraseña actualizada!',
          description: 'Tu contraseña ha sido actualizada exitosamente. Inicia sesión con tu nueva contraseña.',
        });
        
        // Cerrar sesión y redirigir a login
        await supabase.auth.signOut();
        navigate('/login');
      }
    } catch (err) {
      console.error('Error updating password:', err);
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado. Por favor intenta nuevamente.',
        variant: 'destructive',
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
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  {isUpdateMode ? 'Nueva Contraseña' : 'Recuperar Contraseña'}
                </h2>
                <p className="text-white/70 mt-2">
                  {isUpdateMode 
                    ? 'Ingresa tu nueva contraseña para continuar.' 
                    : 'Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.'}
                </p>
              </div>
              
              {isUpdateMode ? (
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Nueva Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-12"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        className="pl-12"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-vita-orange text-white font-bold text-base"
                    disabled={loading}
                  >
                    {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSendEmail} className="space-y-6">
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
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
