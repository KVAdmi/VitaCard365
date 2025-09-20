import { IVITA_URL } from "./config";

export async function askIVita(message, history = []) {
  const r = await fetch(IVITA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: message, history }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || "Upstream");
  return j.output || j.text || "…";
}
