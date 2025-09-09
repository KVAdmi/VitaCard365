
import React from 'react';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabaseClient';

const GoogleLoginButton = () => {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  return (
    <Button onClick={handleGoogleLogin} variant="outline" size="lg" className="w-full border border-white/20 bg-white/10 text-white hover:bg-white/20 flex items-center justify-center">
      <img className="w-6 h-6 mr-3" alt="Google logo" src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" />
      Continuar con Google
    </Button>
  );
};

export default GoogleLoginButton;
