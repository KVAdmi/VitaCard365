// Helpers for fixed Central Mexico timezone calculations
export const MX_TZ = 'America/Mexico_City';

// Returns 'YYYY-MM-DD' for the given instant in Mexico City timezone
export function dateKeyMX(d: Date): string {
  // en-CA yields ISO-like YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MX_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function dayOfWeekMX(d: Date): number {
  // Convert the instant to MX local clock, then read getDay()
  const local = new Date(d.toLocaleString('en-US', { timeZone: MX_TZ }));
  return local.getDay(); // 0=Sun ... 6=Sat
}

export function dayLetterMX(d: Date): string {
  const map = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  return map[dayOfWeekMX(d)] ?? '';
}

export function lastNDaysKeysMX(n: number, from?: Date): string[] {
  const base = from ? new Date(from) : new Date();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    out.push(dateKeyMX(d));
  }
  return out;
}
