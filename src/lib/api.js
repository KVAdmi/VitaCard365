// src/lib/api.js
const API_BASE = (import.meta.env.VITE_API_BASE ?? "https://api.vitacard365.com").replace(/\/+$/,"");
const PREF_PATH = "/api/mercadopago/preference";

export async function createPreference(payload) {
  try {
    // Validar que el monto sea un número antes de enviarlo
    const amount = Number(payload.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Monto inválido');
    }

    // Preparar payload con los nombres correctos que espera el backend
    const validPayload = {
      plan: payload.plan || 'individual',
      frequency: payload.frequency || 'monthly', 
      familySize: payload.familySize || 1,
      unit_price: amount // Backend espera 'unit_price', no 'amount'
    };

    console.log('[API] Enviando payload:', validPayload);

    const res = await fetch(`${API_BASE}${PREF_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify(validPayload),
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error('[API] Error del servidor:', data);
      throw new Error(`Error del servidor: ${res.status} - ${data.error || data.message || 'Error desconocido'}`);
    }

    // Validar que la respuesta tenga los campos necesarios
    if (!data || (!data.init_point && !data.sandbox_init_point && !data.preferenceId)) {
      console.error('[API] Respuesta inválida:', data);
      throw new Error('Respuesta inválida del servidor de pagos');
    }

    console.log('[API] Preferencia creada exitosamente:', data);
    return data;
  } catch (error) {
    console.error('[API] Error creando preferencia:', error);
    throw error;
  }
}
