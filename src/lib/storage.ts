import { Medicion } from '../types/medicion';

const KEY = 'miChequeo:mediciones';

export function loadMediciones(): Medicion[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveMedicion(m: Medicion) {
  const all = loadMediciones();
  const next = [m, ...all].slice(0, 1000); // cap defensivo
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}