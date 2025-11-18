
import React from 'react';
import { Button } from '../ui/button';
import { signInWithGoogle } from '@/lib/auth';
import { useToast } from './use-toast';

const GoogleLoginButton = ({ nextPath } = {}) => {
  const { toast } = useToast();
  
  const handleGoogleLogin = async () => { 
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error en login de Google:', error);
      toast({
        title: 'Error de Google Login',
        description: error.message || 'No se pudo iniciar sesión con Google. Por favor intenta de nuevo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button onClick={handleGoogleLogin} variant="outline" size="lg" className="w-full border border-white/20 bg-white/10 text-white hover:bg-white/20 flex items-center justify-center">
      <img className="w-6 h-6 mr-3" alt="Google logo" src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" />
      Continuar con Google
    </Button>
  );
};

export default GoogleLoginButton;
