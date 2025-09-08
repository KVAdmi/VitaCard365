export const VITA_BINS = {
  KV:  'VITAKV',   // cortesía
  IND: 'VITAIND',  // individual (MP)
  FAM: 'VITAFAM',  // familiar (MP)
  EMP: 'VITAEMP',  // empresarial
  ZIS: 'VITAZIS',  // partner AZISTED
} as const;

export function randomCode(len = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[(Math.random() * chars.length) | 0];
  return s;
}

export async function generateVitaId(kind: keyof typeof VITA_BINS, isUnique: (id: string) => Promise<boolean>) {
  const bin = VITA_BINS[kind];
  let candidate;
  do {
    candidate = `${bin} ${randomCode(8)}`;
  } while (!(await isUnique(candidate)));
  return candidate;
}
