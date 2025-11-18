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
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stage = searchParams.get('stage'); // 'update' for password update stage

  const isNative = Capacitor.isNativePlatform?.();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const redirectTo = isNative 
        ? 'vitacard365://auth/recovery'
        : `${window.location.origin}/reset-password?stage=update`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'No se pudo enviar el correo de recuperación.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '¡Listo!',
          description: 'Si tu correo está registrado, recibirás instrucciones para recuperar tu contraseña.',
        });
        // Optionally navigate back to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al procesar tu solicitud.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'No se pudo actualizar la contraseña.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '¡Contraseña actualizada!',
          description: 'Tu contraseña ha sido actualizada correctamente. Ahora debes iniciar sesión nuevamente.',
        });

        // Client requirement: ALWAYS sign out after password change
        await supabase.auth.signOut();
        
        // Navigate to login
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Update password error:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al actualizar tu contraseña.',
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
                  {stage === 'update' ? 'Nueva Contraseña' : 'Recuperar Contraseña'}
                </h2>
                <p className="text-white/70 mt-2">
                  {stage === 'update' 
                    ? 'Ingresa tu nueva contraseña para actualizar tu cuenta.'
                    : 'Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.'}
                </p>
              </div>
              
              {stage === 'update' ? (
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-white">Nueva Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        className="pl-12 pr-12"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-white/80 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repite tu contraseña"
                        className="pl-12 pr-12"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-white/80 hover:text-white"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
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
