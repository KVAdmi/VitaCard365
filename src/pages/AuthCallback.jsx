

import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback() {
  const { setSession, setAccess } = useContext(AuthContext);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      // Solo restaurar sesión y acceso
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        nav('/login', { replace: true });
        return;
      }
      setSession(sessionData.session);
      let acceso = null;
      try {
        const { data: perfil, error: err } = await supabase
          .from('profiles_certificado_v2')
          .select('acceso_activo')
          .eq('user_id', sessionData.session.user.id)
          .single();
        acceso = { activo: !!perfil?.acceso_activo };
      } catch {
        acceso = { activo: false };
      }
      setAccess(acceso);
      const targetRoute = acceso.activo ? '/dashboard' : '/mi-plan';
      nav(targetRoute, { replace: true });
    })();
  }, [nav, setSession, setAccess]);

  return <div>Procesando login…</div>;
}
