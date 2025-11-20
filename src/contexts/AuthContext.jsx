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
  const [ready, setReady] = useState(false);

  // Inicialización simple de sesión, sin timeouts ni flags OAuth
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log(
          '[AuthContext][init] session:',
          data?.session?.user?.id || 'none'
        );

        if (!isMounted) return;

        if (error) {
          console.warn('[AuthContext] Error restaurando sesión:', error);
          setSession(null);
          setAccess(null);
        } else {
          setSession(data?.session ?? null);
          if (data?.session) {
            await fetchAccess(data.session.user.id);
          } else {
            setAccess(null);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.warn('[AuthContext] Error restaurando sesión (catch):', err);
        setSession(null);
        setAccess(null);
      } finally {
        if (isMounted) {
          setReady(true);
        }
      }
    })();


    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!isMounted) return;
      setSession(s ?? null);
      // Si no hay sesión, limpiamos acceso.
      if (!s) {
        setAccess(null);
      }
    });

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe?.();
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
      console.log(
        '[AuthContext][fetchAccess][ok] acceso_activo:',
        accesoActivo
      );

      setAccess({
        activo: accesoActivo,
        estado_pago: perfil?.estado_pago,
        membresia: perfil?.membresia,
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
        password: password,
      });

      if (error) {
        console.error('[AuthContext][login][error]', error.message);
        throw error;
      }

      console.log('[AuthContext][login][ok] user:', data.user?.id);

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
          data: metadata,
        },
      });

      if (error) {
        console.error('[AuthContext][register][error]', error.message);
        throw error;
      }

      console.log('[AuthContext][register][ok] user:', data.user?.id);

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

  // Reset explícito del estado de auth al entrar a /login (useCallback para referencia estable)
  const resetAuthState = React.useCallback(async () => {
    console.log('[AuthContext][resetAuthState] reset solicitado');
    setReady(false);
    setSession(null);
    setAccess(null);

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('[AuthContext] Error en resetAuthState:', error);
        setSession(null);
        setAccess(null);
      } else {
        setSession(data?.session ?? null);
        if (data?.session) {
          await fetchAccess(data.session.user.id);
        } else {
          setAccess(null);
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Error en resetAuthState (catch):', err);
      setSession(null);
      setAccess(null);
    } finally {
      setReady(true);
    }
  }, [fetchAccess]);

  // Función de logout
  const logout = async () => {
    try {
      console.log('[AuthContext][logout]');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setAccess(null);

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
    <AuthContext.Provider
      value={{
        session,
        setSession,
        user: session?.user || null,
        access,
        setAccess,
        ready,
        login,
        register,
        logout,
        fetchAccess,
        resetAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
