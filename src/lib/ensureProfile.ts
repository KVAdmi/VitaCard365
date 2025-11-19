import { supabase } from '@/lib/supabaseClient';
import { DEBUG_AUTH } from '@/config/debug';

export async function ensureProfile(userId: string, email?: string) {
  if (!userId) return;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error && DEBUG_AUTH) {
      console.warn('[ensureProfile] select error:', error.message);
    }
    if (!data) {
      const name = (email?.split('@')[0] || 'Usuario').replace(/[^a-zA-Z0-9_.-]/g,'_');
      const { error: insertError } = await supabase.from('profiles').insert({
        user_id: userId,
        name,
        email: email || 'sin-email@local'
      });
      if (DEBUG_AUTH) {
        if (insertError) console.error('[ensureProfile] insert error:', insertError.message);
        else console.log('[ensureProfile] perfil creado para', userId);
      }
    } else {
      if (DEBUG_AUTH) console.log('[ensureProfile] perfil ya existe:', userId);
    }
  } catch (e:any) {
    if (DEBUG_AUTH) console.error('[ensureProfile] exception:', e.message || e);
  }
}
