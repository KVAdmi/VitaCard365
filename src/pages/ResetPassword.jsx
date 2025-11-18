import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import VitaCard365Logo from '../components/Vita365Logo';
import { useToast } from '../components/ui/use-toast';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Capacitor } from '@capacitor/core';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const stage = (params.get('stage') || '').toLowerCase(); // '' | 'update'
  const isUpdateStage = stage === 'update';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const title = useMemo(() => isUpdateStage ? 'Nueva Contraseña' : 'Recuperar Contraseña', [isUpdateStage]);
  const description = useMemo(
    () => isUpdateStage
      ? 'Ingresa tu nueva contraseña para continuar.'
      : 'Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.',
    [isUpdateStage]
  );

  // Envío del correo de recuperación
  const handleSendRecovery = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectTo = 'https://vitacard365-react.netlify.app/#/reset-password?stage=update';
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;

      toast({
        title: '¡Listo!',
        description: 'Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.',
      });

      // Opcional: regresar a login
      setTimeout(() => navigate('/login', { replace: true }), 800);
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.message || 'No fue posible enviar el correo de recuperación.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Confirmación de nueva contraseña (etapa update)
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPass || newPass.length < 6) {
      toast({ title: 'Contraseña inválida', description: 'Debe tener al menos 6 caracteres.', variant: 'destructive' });
      return;
    }
    if (newPass !== confirmPass) {
      toast({ title: 'Las contraseñas no coinciden', description: 'Verifica e inténtalo de nuevo.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // Requiere sesión temporal de recovery (hidrata via deep link en src/lib/auth.ts)
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;

      toast({ title: 'Contraseña actualizada', description: 'Vuelve a iniciar sesión para continuar.' });

      // Requisito: SIEMPRE volver a loguear
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login', { replace: true }), 600);
    } catch (err) {
      toast({
        title: 'No se pudo actualizar la contraseña',
        description: err?.message || 'Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{title} - VitaCard 365</title>
        <meta name="description" content="Recupera el acceso a tu cuenta VitaCard 365." />
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
                <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
                <p className="text-white/70 mt-2">{description}</p>
              </div>

              {!isUpdateStage ? (
                <form onSubmit={handleSendRecovery} className="space-y-6">
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
                        autoComplete="username email"
                        inputMode="email"
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
              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="newPass">Nueva contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                      <Input
                        id="newPass"
                        type={showNew ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        className="pl-12 pr-12"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-white/80 hover:text-white"
                        onClick={() => setShowNew(!showNew)}
                      >
                        {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPass">Confirmar contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                      <Input
                        id="confirmPass"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Repite tu nueva contraseña"
                        className="pl-12 pr-12"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-white/80 hover:text-white"
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-vita-orange text-white font-bold text-base"
                    disabled={loading}
                  >
                    {loading ? 'Actualizando...' : 'Confirmar nueva contraseña'}
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