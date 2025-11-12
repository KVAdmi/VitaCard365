

import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback() {
  const { setSession, setAccess, setIsReturningFromOAuth } = useContext(AuthContext);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      // Extraer el código de la URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      console.log('[AuthCallback] Código extraído:', code);
      
      if (!code) {
        console.error('[AuthCallback] No se encontró código en la URL');
        nav('/login', { replace: true });
        return;
      }
      
      // Intercambia código por sesión
      console.log('[AuthCallback] Intercambiando código...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data?.session) {
        console.error('[AuthCallback] Error en exchangeCodeForSession:', error);
        console.log('[AuthCallback] data:', data);
        nav('/login', { replace: true });
        return;
      }
      console.log('[AuthCallback] Sesión obtenida, user:', data.session.user.id);

      // Marca retorno OAuth
      localStorage.setItem('oauth_ok', '1');
      setIsReturningFromOAuth(true);
      setSession(data.session);

      // Leer contexto (login o register)
      const context = localStorage.getItem('oauth_context');
      console.log('[AuthCallback] Contexto leído:', context);
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
