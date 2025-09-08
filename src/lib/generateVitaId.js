// Universal Vita ID generator
import { supabase } from './supabase';

const BIN_MAP = {
  KV: 'VITAKV',
  IND: 'VITAIND',
  FAM: 'VITAFAM',
  EMP: 'VITAEMP',
};

function randomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function generateVitaId(type) {
  const bin = BIN_MAP[type];
  if (!bin) throw new Error('Tipo de folio Vita inválido');
  let vitaId;
  let tries = 0;
  do {
    vitaId = `${bin} ${randomCode(8)}`;
    // Garantiza unicidad en DB
    const { data } = await supabase
      .from('subscribers')
      .select('id')
      .eq('id_vita', vitaId);
    if (!data || data.length === 0) break;
    tries++;
  } while (tries < 5);
  if (tries === 5) throw new Error('No se pudo generar un folio Vita único');
  return vitaId;
}
