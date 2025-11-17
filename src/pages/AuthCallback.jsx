

import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback() {
  const { setSession, setAccess, setIsReturningFromOAuth } = useContext(AuthContext);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      console.log('[AuthCallback][web] Iniciando callback de OAuth...');
      // Supabase maneja automáticamente el intercambio PKCE
      // Solo necesitamos obtener la sesión actual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        console.error('[AuthCallback][web] Error obteniendo sesión:', sessionError);
        nav('/login', { replace: true });
        return;
      }
      console.log('[AuthCallback][web] Sesión obtenida, user:', sessionData.session.user.id);
      const data = sessionData;
      // Marca retorno OAuth
      localStorage.setItem('oauth_ok', '1');
      setIsReturningFromOAuth(true);
      setSession(data.session);
      // Leer contexto (login o register)
      const context = localStorage.getItem('oauth_context');
      console.log('[AuthCallback][web] Contexto leído:', context);
      localStorage.removeItem('oauth_context'); // Limpiar inmediatamente
      // Si viene de REGISTER, ir directo a payment-gateway y NO redirigir luego a /mi-plan
      if (context === 'register') {
        console.log('[AuthCallback][web] Contexto: register → /payment-gateway');
        localStorage.removeItem('oauth_ok');
        setIsReturningFromOAuth(false);
        nav('/payment-gateway', { replace: true });
        return;
      }
      // Si viene de LOGIN, consultar acceso
      console.log('[AuthCallback][web] Contexto: login, consultando acceso...');
      let acceso = null;
      try {
        const { data: perfil, error: err } = await supabase
          .from('profiles_certificado_v2')
          .select('acceso_activo')
          .eq('user_id', data.session.user.id)
          .single();
        acceso = { activo: !!perfil?.acceso_activo };
        console.log('[AuthCallback][web] acceso_activo:', acceso.activo);
      } catch {
        acceso = { activo: false };
        console.log('[AuthCallback][web] Sin perfil o error, acceso: false');
      }
      setAccess(acceso);
      // Navega según acceso
      localStorage.removeItem('oauth_ok');
      setIsReturningFromOAuth(false);
      const targetRoute = acceso.activo ? '/dashboard' : '/mi-plan';
      console.log('[AuthCallback][web] Navegando a:', targetRoute);
      nav(targetRoute, { replace: true });
    })();
  }, [nav, setSession, setAccess, setIsReturningFromOAuth]);

  return <div>Procesando login…</div>;
}
