

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
        const context = localStorage.getItem('oauth_context');
        localStorage.removeItem('oauth_context');
        // Si el contexto es register, navega a /perfil y muestra aviso de sesión perdida
        if (context === 'register') {
          nav('/perfil', { replace: true, state: { sessionLost: true } });
          return;
        }
        // Si el contexto es login, navega a /payment-gateway y muestra aviso de sesión perdida
        if (context === 'login') {
          nav('/payment-gateway', { replace: true, state: { sessionLost: true } });
          return;
        }
        // Si no hay contexto, navega a login como fallback
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
      // Si viene de REGISTER, ir a payment-gateway y tras pago registrar en profiles_certificado_v2 y redirigir a /perfil
      if (context === 'register') {
        console.log('[AuthCallback][web] Contexto: register → /payment-gateway');
        localStorage.removeItem('oauth_ok');
        setIsReturningFromOAuth(false);
        // Verificar si el usuario ya está en profiles_certificado_v2
        const userId = data.session.user.id;
        try {
          const { data: perfil, error: perfilErr } = await supabase
            .from('profiles_certificado_v2')
            .select('user_id')
            .eq('user_id', userId)
            .maybeSingle();
          if (!perfilErr && !perfil) {
            // Si no existe, crear registro mínimo
            await supabase
              .from('profiles_certificado_v2')
              .upsert({ user_id: userId, acceso_activo: false });
            console.log('[AuthCallback][web] Registro creado en profiles_certificado_v2');
          }
        } catch (e) {
          console.warn('[AuthCallback][web] Error al registrar en profiles_certificado_v2:', e);
        }
        nav('/perfil', { replace: true });
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
