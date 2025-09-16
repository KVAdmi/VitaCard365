import { SleepSession } from './types';

const KEY = 'miChequeo:sleepSessions';
const ACTIVE_KEY = 'miChequeo:sleepActive';

export function loadSleep(): SleepSession[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function saveSleep(s: SleepSession) {
  const all = [s, ...loadSleep()].slice(0, 1000);
  localStorage.setItem(KEY, JSON.stringify(all));
  return all;
}

export function setActive(startTs: number|null) {
  if (startTs) localStorage.setItem(ACTIVE_KEY, String(startTs));
  else localStorage.removeItem(ACTIVE_KEY);
}

export function getActive(): number|null {
  const v = localStorage.getItem(ACTIVE_KEY);
  return v ? Number(v) : null;
}