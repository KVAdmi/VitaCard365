import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Preferences } from '@capacitor/preferences';
import { DEBUG_AUTH, DEBUG_ACCESS } from '@/config/debug';


export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe ser usado dentro de AuthProvider');
  return context;
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [access, setAccess] = useState(null);
  const [ready, setReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    let graceTimeout;
    (async () => {
      try {
        const rememberMe = localStorage.getItem('remember_me') === 'true';
        const oauthFlag = localStorage.getItem('oauth_ok');
        const storedAccess = await Preferences.get({ key: 'access_state' });
        if (storedAccess.value && SAFE_DEBUG_AUTH) {
          console.log('[AuthContext][restore] sesión recuperada desde storage');
          setAccess(JSON.parse(storedAccess.value));
        }
        const { data } = await supabase.auth.getSession();
        if (SAFE_DEBUG_AUTH) console.log('[AuthContext][init] session:', data?.session?.user?.id || 'none');
        setSession(data?.session ?? null);
        setReady(true);
        if (data?.session) await fetchAccess(data.session.user.id);
        if (rememberMe) {
          const { data: restoredSession } = await supabase.auth.getSession();
          if (restoredSession?.session) {
            setSession(restoredSession.session);
            await fetchAccess(restoredSession.session.user.id);
          }
        }
        const { data: preSession } = await supabase.auth.getSession();
        if (!preSession?.session) {
          if (SAFE_DEBUG_AUTH) console.log('[AuthContext][init] no session → reset access');
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
        if (!data?.session) setReady(true);
      } catch (error) {
        console.error('[AuthContext][init][error]', error);
        setReady(true);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s ?? null);
      setReady(true);
      if (s) {
        await fetchAccess(s.user.id);
        localStorage.removeItem('oauth_ok');
      } else {
        if (SAFE_DEBUG_AUTH) console.log('[AuthContext][onAuthStateChange] sesión cerrada');
        setAccess(null);
      }
    });
    return () => {
      sub?.subscription?.unsubscribe?.();
      if (graceTimeout) clearTimeout(graceTimeout);
    };
  }, []);

  const fetchAccess = async (userId) => {
    if (SAFE_DEBUG_AUTH) console.log('[AuthContext][fetchAccess] userId:', userId);
    try {
      const { data: perfil, error } = await supabase
        .from('profiles')
        .select('acceso_activo, estado_pago')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        console.error('[AuthContext][fetchAccess][error]', error);
        if (SAFE_DEBUG_AUTH) console.warn('[AuthContext][fetchAccess] conservo último estado');
        return;
      }
      const accesoActivo = !!perfil?.acceso_activo;
      if (SAFE_DEBUG_AUTH) console.log('[AuthContext][fetchAccess][ok] acceso_activo:', accesoActivo);
      const newAccess = {
        activo: accesoActivo,
        estado_pago: perfil?.estado_pago || null
      };
      setAccess(newAccess);
      await Preferences.set({ key: 'access_state', value: JSON.stringify(newAccess) });
    } catch (err) {
      console.error('[AuthContext][fetchAccess][catch]', err);
      if (SAFE_DEBUG_AUTH) console.warn('[AuthContext][fetchAccess] conservo último estado');
    }
  };

  // Login mejorado: distingue credenciales inválidas vs error interno
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      if (SAFE_DEBUG_AUTH) console.log('[AuthContext][login] start', { email });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message && error.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('Credenciales incorrectas. Verifica email y contraseña.');
        }
        throw new Error('Error interno al iniciar sesión. Intenta más tarde.');
      }
      const user = data?.user;
      if (SAFE_DEBUG_AUTH) console.log('[AuthContext][login] signed in, userId:', user?.id);
      if (user?.id) {
        fetchAccess(user.id).catch((err) => {
          console.error('[AuthContext][login][fetchAccess][error]', err);
        });
      }
    } finally {
      setAuthLoading(false);
      if (SAFE_DEBUG_AUTH) console.log('[AuthContext][login] end');
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      setSession,
      user: session?.user || null,
      access,
      setAccess,
      ready,
      login,
      authLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Preferences } from '@capacitor/preferences';
import { DEBUG_AUTH, DEBUG_ACCESS } from '@/config/debug';

const SAFE_DEBUG_AUTH = typeof DEBUG_AUTH === 'boolean' ? DEBUG_AUTH : false;
  return (
    <AuthContext.Provider value={{
      session,
      setSession,
      user: session?.user || null,
      access,
      setAccess,
      ready,
      login,
      authLoading
    }}>
      {children}
    </AuthContext.Provider>
  );


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
  ;

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

