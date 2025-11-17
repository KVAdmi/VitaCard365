
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
      console.log('[AuthContext][init] session:', data?.session?.user?.id || 'none');
      setSession(data?.session ?? null);
      
      // Si hay sesión, consultar acceso inmediatamente
      if (data?.session) {
        await fetchAccess(data.session.user.id);
      }
      
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

    let navigationDone = false;
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      console.log('[AuthContext][onAuthStateChange]', _e, s?.user?.id || 'none');
      setSession(s ?? null);
      if (s) {
        await fetchAccess(s.user.id);
        setReady(true);
        localStorage.removeItem('oauth_ok');
        // Solo navegar una vez en nativo tras Google login/registro
        if (window && window.Capacitor && window.Capacitor.isNativePlatform && !navigationDone) {
          navigationDone = true;
          // Detectar contexto
          const context = localStorage.getItem('oauth_context') || 'login';
          localStorage.removeItem('oauth_context');
          if (context === 'register') {
            window.alert('¡Bienvenido! Por favor realiza tu pago para activar tu plan.');
            window.location.replace('#/payment-gateway');
            return;
          }
          // login: navegar según acceso
          const { data: perfil } = await supabase
            .from('profiles_certificado_v2')
            .select('acceso_activo')
            .eq('user_id', s.user.id)
            .maybeSingle();
          const accesoActivo = !!perfil?.acceso_activo;
          if (accesoActivo) {
            window.alert('¡Bienvenido de nuevo! Tu plan está activo.');
            window.location.replace('#/dashboard');
          } else {
            window.alert('Tu plan está vencido o pendiente de pago. Por favor realiza el pago para continuar.');
            window.location.replace('#/payment-gateway');
          }
        }
      } else {
        setAccess(null);
      }
    });
    return () => {
      sub?.subscription?.unsubscribe?.();
      if (graceTimeout) clearTimeout(graceTimeout);
    };
  }, []);

  // Función para consultar el acceso desde Supabase
  const fetchAccess = async (userId) => {
    try {
      console.log('[AuthContext][fetchAccess] userId:', userId);
      const { data: perfil, error } = await supabase
        .from('profiles_certificado_v2')
        .select('acceso_activo, estado_pago, membresia')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('[AuthContext][fetchAccess][error]', error);
        setAccess({ activo: false });
        return;
      }
      
      const accesoActivo = !!perfil?.acceso_activo;
      console.log('[AuthContext][fetchAccess][ok] acceso_activo:', accesoActivo);
      setAccess({ 
        activo: accesoActivo,
        estado_pago: perfil?.estado_pago,
        membresia: perfil?.membresia
      });
    } catch (err) {
      console.error('[AuthContext][fetchAccess][catch]', err);
      setAccess({ activo: false });
    }
  };

  // Función de login con email y password
  const login = async (email, password) => {
    try {
      console.log('[AuthContext][login] email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });
      
      if (error) {
        console.error('[AuthContext][login][error]', error.message);
        throw error;
      }
      
      console.log('[AuthContext][login][ok] user:', data.user?.id);
      
      // Actualizar sesión y consultar acceso
      setSession(data.session);
      if (data.user?.id) {
        await fetchAccess(data.user.id);
      }
      
      return data;
    } catch (error) {
      console.error('[AuthContext][login][catch]', error);
      throw error;
    }
  };

  // Función de registro con email y password
  const register = async (email, password, metadata = {}) => {
    try {
      console.log('[AuthContext][register] email:', email);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: metadata
        }
      });
      
      if (error) {
        console.error('[AuthContext][register][error]', error.message);
        throw error;
      }
      
      console.log('[AuthContext][register][ok] user:', data.user?.id);
      
      // Si hay sesión inmediata, actualizarla
      if (data.session) {
        setSession(data.session);
        if (data.user?.id) {
          await fetchAccess(data.user.id);
        }
      }
      
      return data;
    } catch (error) {
      console.error('[AuthContext][register][catch]', error);
      throw error;
    }
  };

  // Función de login con Google OAuth
  const signInWithGoogle = async (googleData) => {
    try {
      console.log('[AuthContext][signInWithGoogle] email:', googleData?.email);
      
      // En este caso, Supabase ya manejó el OAuth
      // Solo necesitamos actualizar el perfil si es necesario
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session) {
        setSession(sessionData.session);
        await fetchAccess(sessionData.session.user.id);
      }
      
      return sessionData;
    } catch (error) {
      console.error('[AuthContext][signInWithGoogle][catch]', error);
      throw error;
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      console.log('[AuthContext][logout]');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setAccess(null);
      localStorage.removeItem('oauth_ok');
    } catch (error) {
      console.error('[AuthContext][logout][error]', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      session, 
      setSession,
      user: session?.user || null,
      access, 
      setAccess,
      isReturningFromOAuth, 
      setIsReturningFromOAuth,
      ready,
      login,
      register,
      signInWithGoogle,
      logout,
      fetchAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
}
