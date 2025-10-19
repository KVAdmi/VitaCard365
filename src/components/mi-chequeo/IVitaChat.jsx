
import { useState } from "react";
import { askIVita } from "@/api/evitaApi";

export default function IVitaChat() {
  // Chat solo texto: sin botón de micrófono ni reconocimiento de voz

  const [messages, setMessages] = useState([]); // [{role, content}]
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [remaining, setRemaining] = useState(null);

  async function handleSend(e) {
    e?.preventDefault?.();
    if (loading) return;

    const userText = (input || "").trim();
    if (!userText) return;

    // 1) Limpia estado viejo
    setErrorMsg("");
    setLoading(true);

    // 2) Empuja mensaje del usuario
    const next = [...messages, { role: "user", content: userText }];
    setMessages(next);
    setInput("");

    // 3) Historial para API
    const historyForApi = next.map(m => ({ role: m.role, content: m.content }));

    try {
      const r = await askIVita(userText, historyForApi);
      console.log("[chat] askIVita:", r);

      if (!r.ok) {
        if (r.status === 429) {
          setRemaining(r.remaining ?? 0);
          setErrorMsg('Has llegado al límite de mensajes diarios. Vuelve mañana para tu consulta con i‑Vita.');
          setLoading(false);
          return;
        }
        setErrorMsg(
          `Error de conexión${r.status ? ` (status ${r.status})` : ""}. ${
            r.errorDetail || ""
          }`.trim()
        );
        setLoading(false);
        return;
      }

      const botText = (r.text || "").trim() || "No tengo una respuesta en este momento.";
      setMessages(prev => [...prev, { role: "assistant", content: botText }]);

      // 4) Asegura que el banner se quite
  setErrorMsg("");
  if (typeof r.remaining === 'number') setRemaining(r.remaining);
    } catch (err) {
      console.error("[chat] fetch error:", err);
      setErrorMsg("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ivita-chat">
      <form onSubmit={handleSend} className="chat-input">
        {/* lista de mensajes */}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>{m.content}</div>
        ))}

        {/* banner de error controlado por estado y botón reintentar */}
        {errorMsg && (
          <div className="banner error">
            {errorMsg}
            <button onClick={() => { setErrorMsg(""); handleSend(); }} type="button" style={{marginLeft:8}}>
              Reintentar
            </button>
          </div>
        )}

        {/* input + botón */}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || (remaining !== null && remaining <= 0)}>
          Enviar
        </button>
      </form>
      {remaining !== null && remaining >= 0 && (
        <div className="text-xs text-white/70 mt-2">Consultas disponibles hoy: {remaining}</div>
      )}
    </div>
  );
}
