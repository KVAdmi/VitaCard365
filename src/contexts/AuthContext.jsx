
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { makeVitaId } from '../utils/generateVitaId';
import { ENT, SRC } from '../services/entitlements';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

// El generador unificado ya está en makeVitaId

// Simulación de validación de KV y ZIS
const checkActivationCode = async (code) => {
  if (!code) return { valid: false };
  const upper = code.toUpperCase();
  if (upper.startsWith('KV')) return { valid: true, type: 'KV', message: 'KV válido' };
  if (upper.startsWith('AZISTED') || upper.startsWith('ZIS')) return { valid: true, type: 'ZIS', message: 'ZIS válido' };
  return { valid: false, message: 'El código ingresado no es válido o ha expirado.' };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isSupabaseConnected = true; // Siempre consideramos que está conectado

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session ? session.user : null);
      } catch (error) {
        console.error("Error al obtener sesión:", error);
        // Limpiar estado por si hay datos corruptos
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('vita-auth');
      } finally {
        setLoading(false);
      }
    };
    
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? session.user : null);
    });

    return () => subscription?.unsubscribe();
  }, [isSupabaseConnected]);

  const login = async (email, password) => {
    try {
      console.log('Intentando iniciar sesión con:', { email });
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      console.log('Respuesta de login:', { data: !!data, error: error?.message || null });
      
      if (error) {
        console.error('Error de autenticación:', error);
        throw error;
      }
      
      return { data };
    } catch (error) {
      console.error('Error crítico en login:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    const { email, password, name, activationCode, partnerCode } = userData;
    let entitlements = [ENT.NONE];
    let source = SRC.NORMAL;
    let vita_id = null;
    let codeCheck = { valid: false };
    if (activationCode) {
      codeCheck = await checkActivationCode(activationCode);
      if (codeCheck.valid && codeCheck.type === 'KV') {
        entitlements = [ENT.PAID];
        source = SRC.KV;
        vita_id = makeVitaId('KV');
      } else if (codeCheck.valid && codeCheck.type === 'ZIS') {
        entitlements = [ENT.PAID];
        source = SRC.PARTNER;
        vita_id = makeVitaId('ZIS');
      }
    }
    if (isSupabaseConnected) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            alias: name.split(' ')[0],
            activation_code: activationCode,
            vita_card_id: vita_id || makeVitaId('IND'),
            entitlements,
            source,
          },
        },
      });
      if (error) throw error;
      return { user: data.user, codeCheck };
    } else {
      // Mock registration for demo purposes
      const mockUser = {
        id: uuidv4(),
        email: email,
        user_metadata: {
          name: name,
          alias: name.split(' ')[0],
          vita_card_id: vita_id || makeVitaId('IND'),
          entitlements,
          source,
        },
        app_metadata: { provider: 'email' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('vita-user', JSON.stringify(mockUser));
      setUser(mockUser);
      return { user: mockUser, codeCheck };
    }
  };
  // Gating: requirePaid
  const requirePaid = () => {
    if (!user) return false;
    const ent = user.entitlements || user.user_metadata?.entitlements;
    return Array.isArray(ent) && ent.includes(ENT.PAID);
  };

  const logout = async () => {
    if (isSupabaseConnected) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      localStorage.removeItem('vita-user');
    }
    try {
      // Limpieza defensiva de posibles restos
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('vita-auth');
    } catch {}
    setUser(null);
    // Navegar a landing para resetear toda la UI de manera segura
    try { window.location.replace('/'); } catch {}
  };

  const updateUser = async (updateData) => {
    if (isSupabaseConnected) {
      const { data, error } = await supabase.auth.updateUser({ data: updateData });
      if (error) throw error;
      return data;
    } else {
      // Mock update
      const updatedUser = { ...user, user_metadata: { ...user.user_metadata, ...updateData } };
      localStorage.setItem('vita-user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { user: updatedUser };
    }
  };


  // Login/Register con Google
  const signInWithGoogle = async ({ id, email, name, picture, accessToken }) => {
    if (isSupabaseConnected) {
      // Buscar perfil existente
      const { data: profile, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') throw selectError;

      // Upsert perfil
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          user_id: id,
          email,
          name,
          alias: name?.split(' ')[0] || '',
          avatar_url: picture,
          vita_card_id: profile?.vita_card_id || generateId('VITA'),
          plan_status: profile?.plan_status || 'inactive',
          created_at: profile?.created_at || new Date().toISOString(),
        }, { onConflict: ['user_id'] });
      if (upsertError) throw upsertError;

      setUser({ id, email, user_metadata: { name, alias: name?.split(' ')[0] || '', avatarUrl: picture, vita_card_id: profile?.vita_card_id || generateId('VITA') } });
      return { id, email, name, picture };
    } else {
      // Mock login Google
      const mockUser = {
        id,
        email,
        user_metadata: { name, alias: name?.split(' ')[0] || '', avatarUrl: picture, vita_card_id: generateId('VITA') },
        app_metadata: { provider: 'google' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('vita-user', JSON.stringify(mockUser));
      setUser(mockUser);
      return mockUser;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    signInWithGoogle,
    loading,
    isAuthenticated: !!user,
    checkActivationCode,
    requirePaid,
    isSupabaseConnected,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
