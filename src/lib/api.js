// src/lib/api.js
const API_BASE = (import.meta.env.VITE_API_BASE ?? "https://api.vitacard365.com").replace(/\/+$/,"");
const PREF_PATH = "/api/mercadopago/preference"; // ← ruta real del backend

export async function createPreference({ plan, frequency, unit_price, familySize }) {
  const res = await fetch(`${API_BASE}${PREF_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify({
      planType: plan,
      frequency,
      familySize,
      unit_price: Number(unit_price),
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(()=> "");
    throw new Error(`API ${res.status} ${text}`);
  }
  return res.json(); // { preferenceId, ... }
}