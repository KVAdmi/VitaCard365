

import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { resolvePostAuthRoute } from '../lib/oauthRouting';

export default function AuthCallback() {
  const { setSession, setAccess, setIsReturningFromOAuth } = useContext(AuthContext);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      console.log('[AuthCallback] Iniciando callback de OAuth...');
      
      // Supabase maneja automáticamente el intercambio PKCE
      // Solo necesitamos obtener la sesión actual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session) {
        console.error('[AuthCallback] Error obteniendo sesión:', sessionError);
        nav('/login', { replace: true });
        return;
      }
      
      console.log('[AuthCallback] Sesión obtenida, user:', sessionData.session.user.id);
      const data = sessionData;

      // Marca retorno OAuth
      localStorage.setItem('oauth_ok', '1');
      setIsReturningFromOAuth(true);
      setSession(data.session);

      // Leer contexto (login o register)
      const rawContext = localStorage.getItem('oauth_context');
      const context = rawContext === 'register' ? 'register' : 'login';
      console.log('[AuthCallback] Contexto leído:', rawContext);
      localStorage.removeItem('oauth_context'); // Limpiar inmediatamente

      const { route: targetRoute, access } = await resolvePostAuthRoute(context, data.session.user.id);
      if (access) {
        setAccess(access);
        console.log('[AuthCallback] Acceso activo:', access.activo);
      }

      localStorage.removeItem('oauth_ok');
      setIsReturningFromOAuth(false);
      console.log('[AuthCallback] Navegando a:', targetRoute);
      nav(targetRoute, { replace: true });
    })();
  }, [nav, setSession, setAccess, setIsReturningFromOAuth]);

  return <div>Procesando login…</div>;
}
