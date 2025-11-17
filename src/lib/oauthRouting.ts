import { supabase } from './supabaseClient';

export type OAuthContext = 'login' | 'register' | null;

export async function resolvePostAuthRoute(context: OAuthContext, userId: string) {
  if (context === 'register') {
    return { route: '/payment-gateway', access: null as { activo: boolean } | null };
  }

  try {
    const { data: perfil, error } = await supabase
      .from('profiles_certificado_v2')
      .select('acceso_activo')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[oauthRouting] Error consultando acceso:', error);
    }

    const accesoActivo = !!perfil?.acceso_activo;
    return { route: accesoActivo ? '/dashboard' : '/mi-plan', access: { activo: accesoActivo } };
  } catch (err) {
    console.error('[oauthRouting] Excepción consultando acceso:', err);
    return { route: '/mi-plan', access: { activo: false } };
  }
}
