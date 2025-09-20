import { useState } from "react";

export function useIVita() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reply, setReply] = useState(null);

  async function sendMessage({ message, question = null, vitals = null }) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://lzjstwsf5ghf6ue2aoubbkka3q0supil.lambda-url.us-east-1.on.aws/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, question, vitals }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Error Lambda: ${err}`);
      }
      const data = await res.json();
      setReply(data.reply);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, reply, sendMessage };
}
