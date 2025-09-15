// src/lib/api.js
const API_BASE = (import.meta.env.VITE_API_BASE ?? "https://api.vitacard365.com").replace(/\/+$/,"");
const PREF_PATH = "/api/mercadopago/preference"; // ← ruta real del backend

export async function createPreference(payload) {
  try {
    // Validar que el monto sea un número antes de enviarlo
    const amount = Number(payload.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Monto inválido');
    }

    // Asegurarnos que el payload tenga los campos necesarios
    const validPayload = {
      ...payload,
      amount: amount // Usar el monto validado
    };

    const res = await fetch(`${API_BASE}${PREF_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify(validPayload),
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(`Error del servidor: ${res.status} - ${data.error || 'Error desconocido'}`);
    }

    // Validar que la respuesta tenga los campos necesarios
    if (!data || (!data.init_point && !data.sandbox_init_point)) {
      throw new Error('Respuesta inválida del servidor de pagos');
    }

    return data;
  } catch (error) {
    console.error('[API] Error creando preferencia:', error);
    throw error;
  }
}