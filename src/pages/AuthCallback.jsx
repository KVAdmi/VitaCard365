

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

      // Parche: marca retorno OAuth y bandera persistente
      localStorage.setItem('oauth_ok', '1');
      setIsReturningFromOAuth(true);
      setSession(data.session);

      // Consulta acceso en Supabase
      let acceso = null;
      try {
        const { data: perfil, error: err } = await supabase
          .from('profiles_certificado_v2')
          .select('acceso_activo')
          .eq('user_id', data.session.user.id)
          .single();
        acceso = { activo: !!perfil?.acceso_activo };
      } catch {
        acceso = { activo: false };
      }
      setAccess(acceso);

      // Navega según acceso y limpia bandera
      localStorage.removeItem('oauth_ok');
      setIsReturningFromOAuth(false);
      nav(acceso.activo ? '/dashboard' : '/mi-plan', { replace: true });
    })();
  }, [nav, setSession, setAccess, setIsReturningFromOAuth]);

  return <div>Procesando login…</div>;
}
