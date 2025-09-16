export const VITALS_KEY = 'miChequeo:mediciones';

export function loadMediciones() {
  try { return JSON.parse(localStorage.getItem(VITALS_KEY) || '[]'); }
  catch { return []; }
}

export function saveMedicion(medicion) {
  const all = loadMediciones();
  const next = [medicion, ...all].slice(0, 1000);
  localStorage.setItem(VITALS_KEY, JSON.stringify(next));
  return next;
}