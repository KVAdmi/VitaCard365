import { supabase } from './supabaseClient';

export async function routeAfterLogin() {
  try {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id || null;
    if (!uid) {
      window.location.hash = '#/login';
      return;
    }
    // Consulta acceso activo
    const { data: acc } = await supabase.from('profiles_certificado_v2').select('acceso_activo').eq('user_id', uid).single();
    if (acc?.acceso_activo) {
      window.location.hash = '#/dashboard';
    } else {
      window.location.hash = '#/payment-gateway';
    }
  } catch {
    window.location.hash = '#/login';
  }
}
