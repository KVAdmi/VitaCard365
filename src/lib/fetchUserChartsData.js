// Utilidad para obtener datos de Supabase para las 6 tarjetas
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchUserChartsData(userId) {
  // Últimos 7 días
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Presión arterial, pulso, SpO2, temperatura, peso
  const { data: mediciones, error: errMed } = await supabase
    .from('mediciones')
    .select('*')
    .eq('usuario_id', userId)
    .gte('ts', since)
    .order('ts', { ascending: true });

  // 2. Glucosa
  const { data: glucosa, error: errGlu } = await supabase
    .from('glucosa')
    .select('*')
    .eq('usuario_id', userId)
    .gte('ts', since)
    .order('ts', { ascending: true });

  // 3. Sueño (opcional, si quieres usarlo)
  // const { data: sleep, error: errSleep } = await supabase
  //   .from('sleep_history')
  //   .select('*')
  //   .eq('user_uuid', userId)
  //   .gte('ts_end', since)
  //   .order('ts_end', { ascending: true });

  return {
    mediciones: mediciones || [],
    glucosa: glucosa || [],
    // sleep: sleep || [],
    error: errMed || errGlu // || errSleep
  };
}
