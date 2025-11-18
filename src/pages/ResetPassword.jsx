import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import VitaCard365Logo from '../components/Vita365Logo';
import { useToast } from '../components/ui/use-toast';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Capacitor } from '@capacitor/core';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Detect if we're in "update password" mode (after clicking recovery link)
  const stage = searchParams.get('stage');
  const isUpdateMode = stage === 'update';

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Determine redirect URL based on platform
      const isNative = Capacitor.isNativePlatform && Capacitor.isNativePlatform();
      const redirectTo = isNative 
        ? 'vitacard365://auth/recovery'
        : `${window.location.origin}/reset-password?stage=update`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      
      if (error) {
        console.error('resetPasswordForEmail error:', error);
        toast({
          title: 'Error',
          description: 'Hubo un problema al enviar el correo. Por favor, intenta nuevamente.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '¡Listo!',
          description: 'Si tu correo está registrado, recibirás instrucciones para recuperar tu contraseña.',
        });
        // Clear the email field after successful submission
        setEmail('');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate password strength (minimum 6 characters as per Supabase default)
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
        console.error('updateUser error:', error);
        toast({
          title: 'Error',
          description: 'No se pudo actualizar la contraseña. Por favor, intenta nuevamente.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '¡Contraseña actualizada!',
          description: 'Tu contraseña ha sido cambiada exitosamente. Por favor, inicia sesión nuevamente.',
        });
        
        // Wait a moment for the toast to be visible
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Sign out the user (as per requirement: always force re-login)
        await supabase.auth.signOut();
        
        // Navigate to login page with a message
        navigate('/login', { 
          replace: true,
          state: { message: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.' }
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
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
                    ? 'Ingresa tu nueva contraseña.'
                    : 'Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.'}
                </p>
              </div>
              
              {isUpdateMode ? (
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Nueva Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-12 pr-12"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-12 pr-12"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
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
                <form onSubmit={handleEmailSubmit} className="space-y-6">
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
