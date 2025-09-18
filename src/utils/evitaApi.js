// utils/evitaApi.js
// Utilidad para enviar preguntas a la API de i-Vita (OpenAI via AWS)

const API_URL = "https://7p6pz4xzgd.execute-api.us-east-1.amazonaws.com/prod";

export async function askEvita(question, context = {}) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question,
        ...context
      })
    });
  if (!res.ok) throw new Error("Error en la API i-Vita");
    const data = await res.json();
    return data?.answer || "Sin respuesta";
  } catch (err) {
  return "Ocurrió un error al conectar con i-Vita.";
  }
}
