import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function SetNewPassword() {
  const nav = useNavigate();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionOk, setSessionOk] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const isValid = !!data.session;
      setSessionOk(isValid);
      if (!isValid) {
        setMsg({
          type: "error",
          text:
            "El enlace de recuperación expiró o no es válido. Solicita uno nuevo desde ‘Olvidé mi contraseña’.",
        });
      }
      console.log("[auth-recovery][set-new-password] session", data.session ? "OK" : "MISSING", data.session?.user?.id || null);
    })();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    if (!sessionOk) {
      setMsg({
        type: "error",
        text:
          "No hay sesión de recuperación activa. Vuelve a solicitar el correo de recuperación.",
      });
      return;
    }
    if (pwd.length < 8) {
      setMsg({ type: "error", text: "La contraseña debe tener mínimo 8 caracteres." });
      return;
    }
    if (pwd !== pwd2) {
      setMsg({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }

    try {
      setLoading(true);
      console.log("[auth-recovery][set-new-password] Intentando updateUser...");
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
      console.log("[auth-recovery][set-new-password] updateUser OK");
      setMsg({
  type: "success",
  text: "Tu contraseña fue actualizada. Puedes abrir la app.",
      });
      setTimeout(() => nav("/login", { replace: true }), 1200);
    } catch (err) {
      console.error("[auth-recovery][set-new-password] updateUser error", err);
      setMsg({
        type: "error",
        text:
          "No se pudo actualizar la contraseña. Si el enlace expiró, solicita uno nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 rounded-xl p-6">
        <h1 className="text-xl font-semibold mb-2">Define tu nueva contraseña</h1>
        <p className="text-sm opacity-80 mb-6">
          Este paso se abrió desde el enlace del correo de recuperación.
        </p>

        {!sessionOk && (
          <div className="mb-4 text-sm text-red-400">
            {msg?.text ??
              "No hay sesión de recuperación activa. Vuelve a solicitar el correo."}
          </div>
        )}

        {msg?.type === "success" ? (
          <>
            <div className="mb-4 text-sm text-green-400">{msg.text}</div>
            <button
              type="button"
              className="w-full p-3 rounded bg-vita-orange text-white font-bold text-base mt-2"
              onClick={() => { window.location.href = 'vitacard365://auth/recovery-done'; }}
            >
              Abrir app
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-sm mb-1">Nueva contraseña</label>
            <input
              type="password"
              className="w-full mb-3 p-3 rounded bg-white/10 outline-none"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              disabled={loading || !sessionOk}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />

            <label className="block text-sm mb-1">Confirmar contraseña</label>
            <input
              type="password"
              className="w-full mb-4 p-3 rounded bg-white/10 outline-none"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              disabled={loading || !sessionOk}
              autoComplete="new-password"
            />

            {msg && (
              <div
                className={`mb-4 text-sm ${
                  msg.type === "error" ? "text-red-400" : "text-green-400"
                }`}
              >
                {msg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !sessionOk}
              className="w-full p-3 rounded bg-blue-600 disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
