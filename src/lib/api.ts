export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Ejemplo de uso
export async function createPreference(planId: string) {
  let origin = 'web';
  if (window && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    origin = 'app';
  }
  const r = await fetch(`${API_BASE}/api/mercadopago/preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId, origin })
  });
  return r.json();
}
