import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { makeVitaId } from '../utils/generateVitaId';
import { ENT, SRC } from '../services/entitlements';
import { Preferences } from '@capacitor/preferences';

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
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let graceTimeout;
    (async () => {
      try {
        const rememberMe = localStorage.getItem('remember_me') === 'true';
        const oauthFlag = localStorage.getItem('oauth_ok');

        // Restaurar estado desde almacenamiento persistente
        const storedAccess = await Preferences.get({ key: 'access_state' });
        if (storedAccess.value) {
          console.log('[AuthContext][restore] sesión recuperada desde storage');
          setAccess(JSON.parse(storedAccess.value));
        }

        const { data } = await supabase.auth.getSession();
        console.log('[AuthContext][init] session:', data?.session?.user?.id || 'none');
        setSession(data?.session ?? null);

        if (data?.session) {
          await fetchAccess(data.session.user.id);
        } else if (rememberMe) {
          const { data: restoredSession } = await supabase.auth.getSession();
          if (restoredSession?.session) {
            setSession(restoredSession.session);
            await fetchAccess(restoredSession.session.user.id);
          }
        }

        // Si no hay sesión después de restauración → limpiar access para evitar bloqueos
        const { data: preSession } = await supabase.auth.getSession();
        if (!preSession?.session) {
          console.log('[AuthContext][init] no session → reset access');
          setAccess(null);
          await Preferences.remove({ key: 'access_state' });
        }

        if (oauthFlag === '1' && !data?.session) {
          graceTimeout = setTimeout(() => {
            setReady(true);
            localStorage.removeItem('oauth_ok');
          }, 5000);
        } else {
          setReady(true);
        }

        // Garantizar que si no hay sesión, ready esté en true
        if (!data?.session) {
          setReady(true);
        }
      } catch (error) {
        console.error('[AuthContext][init][error]', error);
        // Aunque falle Supabase, marcamos ready para que la UI no se quede colgada en "Cargando..."
        setReady(true);
      } finally {
        setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s ?? null);
      if (s) {
        await fetchAccess(s.user.id);
        setReady(true);
        localStorage.removeItem('oauth_ok');
      } else {
        console.log('[AuthContext][onAuthStateChange] sesión cerrada');
        setAccess(null);
        setReady(true);
      }
    });

    return () => {
      sub?.subscription?.unsubscribe?.();
      if (graceTimeout) clearTimeout(graceTimeout);
    };
  }, []);

  const fetchAccess = async (userId) => {
    console.log('[AuthContext][fetchAccess] userId:', userId);
    try {
      const { data: perfil, error } = await supabase
        .from('profiles_certificado_v2')
        .select('acceso_activo, estado_pago, membresia')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthContext][fetchAccess][error]', error);
        console.warn('[AuthContext][fetchAccess] conservo último estado');
        return;
      }

      const accesoActivo = !!perfil?.acceso_activo;
      console.log('[AuthContext][fetchAccess][ok] acceso_activo:', accesoActivo);
      const newAccess = {
        activo: accesoActivo,
        estado_pago: perfil?.estado_pago,
        membresia: perfil?.membresia
      };
      setAccess(newAccess);

      // Guardar estado en almacenamiento persistente
      await Preferences.set({ key: 'access_state', value: JSON.stringify(newAccess) });
    } catch (err) {
      console.error('[AuthContext][fetchAccess][catch]', err);
      console.warn('[AuthContext][fetchAccess] conservo último estado');
    }
  };

  // Función de login con email y password
  const login = async (email, password) => {
    console.log('[AuthContext][login] start', { email });
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext][login][error]', error);
        throw error;
      }

      const user = data?.user;
      console.log('[AuthContext][login] signed in, userId:', user?.id);

      if (user?.id) {
        // Lanzamos fetchAccess en segundo plano para no bloquear el login ni dejar el botón en "Iniciando sesión..."
        fetchAccess(user.id).catch((err) => {
          console.error('[AuthContext][login][fetchAccess][error]', err);
        });
      }
    } finally {
      // Pase lo que pase, apagamos el loader
      setAuthLoading(false);
      console.log('[AuthContext][login] end');
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
      localStorage.removeItem('remember_me');
      // Limpiar datos de RememberMe
      import('../lib/rememberMe').then(({ clearRememberMe }) => {
        clearRememberMe();
      });
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
      fetchAccess,
      authLoading,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}
