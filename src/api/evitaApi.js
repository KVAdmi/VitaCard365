const IVITA_URL = "https://lzjstwsf5ghf6ue2aoubbkka3q0supil.lambda-url.us-east-1.on.aws/";

/**
 * Llama a i-Vita. Devuelve { ok, text, remaining, limit, status, errorDetail }.
 * Loggea TODO para ver qué truena si falla (status, headers, body).
 */
export async function askIVita(input, history = [], meta = {}) {
  try {
    // Límite diario: 10 por usuario
    const { checkAndIncrementChat } = await import('@/lib/chatLimit');
    const gate = await checkAndIncrementChat();
    if (!gate.allowed) {
      return { ok: false, text: '', remaining: 0, limit: gate.limit, status: 429, errorDetail: 'Límite diario alcanzado' };
    }
    const res = await fetch(IVITA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // no metas más headers
      body: JSON.stringify({
        input,
        history,
        device_id: meta.device_id || "device:web",
        user_id: meta.user_id || null,
      }),
    });

    const status = res.status;
    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json")
      ? await res.json().catch(() => null)
      : await res.text().catch(() => "");

    console.log("[askIVita] status:", status, "body:", body);

    if (!res.ok) {
      return {
        ok: false,
        text: "",
        remaining: null,
        limit: null,
        status,
        errorDetail: typeof body === "string" ? body : JSON.stringify(body),
      };
    }

    const output =
      (body && typeof body.output === "string" && body.output.trim()) || "";

    return {
      ok: body?.ok === true,
      text: output,
      remaining: gate.remaining,
      limit: gate.limit,
      status,
      errorDetail: null,
    };
  } catch (err) {
    console.error("[askIVita] fetch error:", err);
    return {
      ok: false,
      text: "",
      remaining: null,
      limit: null,
      status: 0,
      errorDetail: err?.message || String(err),
    };
  }
}
