
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

const generateId = (prefix) => `${prefix}-${uuidv4().split('-')[0].toUpperCase()}`;

const checkActivationCode = async (code) => {
  if (!supabase || !code) return { valid: false };
  const upperCaseCode = code.toUpperCase();
  if (upperCaseCode.startsWith('EMP-')) {
    return { valid: true, type: 'ENTERPRISE', message: 'Código empresarial válido.' };
  }
  if (upperCaseCode.startsWith('FAM-')) {
    return { valid: true, type: 'FAMILY', message: 'Código familiar válido.' };
  }
  return { valid: false, message: 'El código ingresado no es válido o ha expirado.' };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isSupabaseConnected = !!supabase;

  useEffect(() => {
    if (isSupabaseConnected) {
      const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session ? session.user : null);
        setLoading(false);
      };
      getSession();

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session ? session.user : null);
      });

      return () => subscription?.unsubscribe();
    } else {
      // Fallback to localStorage if Supabase is not connected
      try {
        const localUser = localStorage.getItem('vita-user');
        if (localUser) {
          setUser(JSON.parse(localUser));
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('vita-user');
      }
      setLoading(false);
    }
  }, [isSupabaseConnected]);

  const login = async (email, password) => {
    if (isSupabaseConnected) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } else {
      // Mock login for demo purposes
      if (email && password) {
        const mockUser = {
          id: uuidv4(),
          email: email,
          user_metadata: { name: 'Usuario Demo', alias: 'Demo' },
          app_metadata: { provider: 'email' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('vita-user', JSON.stringify(mockUser));
        setUser(mockUser);
      } else {
        throw new Error('Por favor, introduce email y contraseña.');
      }
    }
  };

  const register = async (userData) => {
    const { email, password, name, activationCode } = userData;
    if (isSupabaseConnected) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            alias: name.split(' ')[0],
            activation_code: activationCode,
            vita_card_id: generateId('VITA'),
          },
        },
      });
      if (error) throw error;
      const codeCheck = await checkActivationCode(activationCode);
      return { user: data.user, codeCheck };
    } else {
      // Mock registration for demo purposes
      const mockUser = {
        id: uuidv4(),
        email: email,
        user_metadata: { name: name, alias: name.split(' ')[0], vita_card_id: generateId('VITA') },
        app_metadata: { provider: 'email' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('vita-user', JSON.stringify(mockUser));
      setUser(mockUser);
      return { user: mockUser, codeCheck: { valid: true, message: 'Registro de demostración exitoso.' } };
    }
  };

  const logout = async () => {
    if (isSupabaseConnected) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      localStorage.removeItem('vita-user');
      setUser(null);
    }
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
    generateId,
    isSupabaseConnected,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
