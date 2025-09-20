import React, { useState } from "react";
import { useIVita } from "../hooks/useIVita";

export default function ChatIVita() {
  const [input, setInput] = useState("");
  const { loading, error, reply, sendMessage } = useIVita();

  const handleSend = () => {
    if (input.trim()) {
      sendMessage({ message: input });
      setInput("");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          onKeyDown={e => e.key === "Enter" && handleSend()}
          style={{ flex: 1 }}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          Enviar
        </button>
      </div>
      {loading && <p>Enviando...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {reply && <div style={{ marginTop: 16 }}><b>i-Vita:</b> {reply}</div>}
    </div>
  );
}
