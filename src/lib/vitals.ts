import { supabase } from './supabaseClient';

type VitalType = 'bp' | 'pulso_bpm' | 'spo2' | 'glucosa' | 'weight' | 'height' | 'bmi';

export interface SaveVitalInput {
  user_uuid: string;
  type: VitalType;
  value: number;           // valor principal (por ejemplo sistólica para bp se guarda en extra y value puede ser sistólica)
  unit?: string | null;    // 'mmHg' | 'bpm' | '%' | 'mg/dL' | 'kg' | 'cm' | etc.
  ts?: string;             // ISO string; default now
  source?: string;         // 'manual'
  extra?: Record<string, any> | null; // campos adicionales
}

export async function saveVitalSign(input: SaveVitalInput) {
  const payload = {
    user_uuid: input.user_uuid,
    type: input.type,
    value: input.value,
    unit: input.unit ?? null,
    ts: input.ts ?? new Date().toISOString(),
    source: input.source ?? 'manual',
    extra: input.extra ?? null,
  };
  const { error } = await supabase.from('vital_signs').insert([payload]);
  if (error) throw error;
  return true;
}
