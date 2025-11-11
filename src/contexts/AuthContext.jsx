
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { makeVitaId } from '../utils/generateVitaId';
import { ENT, SRC } from '../services/entitlements';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [access, setAccess] = useState(null);
  const [isReturningFromOAuth, setIsReturningFromOAuth] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let graceTimeout;
    (async () => {
      const oauthFlag = localStorage.getItem('oauth_ok');
      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      if (oauthFlag === '1' && !data?.session) {
        // Espera hasta 5s por la sesión
        graceTimeout = setTimeout(() => {
          setReady(true);
          localStorage.removeItem('oauth_ok');
        }, 5000);
      } else {
        setReady(true);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null);
      if (s) {
        setReady(true);
        localStorage.removeItem('oauth_ok');
      }
    });
    return () => {
      sub?.subscription?.unsubscribe?.();
      if (graceTimeout) clearTimeout(graceTimeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      session, setSession,
      access, setAccess,
      isReturningFromOAuth, setIsReturningFromOAuth,
      ready
    }}>
      {children}
    </AuthContext.Provider>
  );
}
