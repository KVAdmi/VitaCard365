
import React from 'react';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabaseClient';
import { Capacitor } from '@capacitor/core';

const GoogleLoginButton = ({ nextPath } = {}) => {
  const handleGoogleLogin = async () => {
    const isNative = Capacitor.isNativePlatform && Capacitor.isNativePlatform();
    const next = nextPath ? encodeURIComponent(nextPath) : '';
    const base = isNative ? 'vitacard365://auth/callback' : `${window.location.origin}/auth/callback`;
    const redirectTo = next ? `${base}?next=${next}` : base;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
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
