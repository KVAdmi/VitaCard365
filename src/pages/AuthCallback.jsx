

import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback() {
  const { setSession, setAccess, setIsReturningFromOAuth } = useContext(AuthContext);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      // Intercambia código por sesión
      const { data, error } = await supabase.auth.exchangeCodeForSession({ url: window.location.href });
      if (error || !data?.session) {
        nav('/login', { replace: true });
        return;
      }

      // Marca retorno OAuth
      localStorage.setItem('oauth_ok', '1');
      setIsReturningFromOAuth(true);
      setSession(data.session);

      // Leer contexto (login o register)
      const context = localStorage.getItem('oauth_context');
      localStorage.removeItem('oauth_context'); // Limpiar inmediatamente

      // Si viene de REGISTER, ir directo a payment
      if (context === 'register') {
        console.log('[AuthCallback] Contexto: register → /payment-gateway');
        localStorage.removeItem('oauth_ok');
        setIsReturningFromOAuth(false);
        nav('/payment-gateway', { replace: true });
        return;
      }

      // Si viene de LOGIN, consultar acceso
      console.log('[AuthCallback] Contexto: login, consultando acceso...');
      let acceso = null;
      try {
        const { data: perfil, error: err } = await supabase
          .from('profiles_certificado_v2')
          .select('acceso_activo')
          .eq('user_id', data.session.user.id)
          .single();
        acceso = { activo: !!perfil?.acceso_activo };
        console.log('[AuthCallback] Acceso activo:', acceso.activo);
      } catch {
        acceso = { activo: false };
        console.log('[AuthCallback] Sin perfil o error, acceso: false');
      }
      setAccess(acceso);

      // Navega según acceso
      localStorage.removeItem('oauth_ok');
      setIsReturningFromOAuth(false);
      const targetRoute = acceso.activo ? '/dashboard' : '/mi-plan';
      console.log('[AuthCallback] Navegando a:', targetRoute);
      nav(targetRoute, { replace: true });
    })();
  }, [nav, setSession, setAccess, setIsReturningFromOAuth]);

  return <div>Procesando login…</div>;
}
