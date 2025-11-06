import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SetNewPassword() {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (pwd.length < 8) return alert("La contraseña debe tener al menos 8 caracteres");
    if (pwd !== confirm) return alert("Las contraseñas no coinciden");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) {
        console.error(error);
        alert("No se pudo actualizar la contraseña");
        return;
      }
      alert("Contraseña actualizada");
      // Redirige a tu Home/Login según UX
      // navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="max-w-md mx-auto mt-12 p-6 glass-card rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center">Elige tu nueva contraseña</h2>
      <input
        type="password"
        value={pwd}
        onChange={(e)=>setPwd(e.target.value)}
        placeholder="Nueva contraseña"
        required
        minLength={8}
        className="w-full mb-3 p-2 rounded border"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e)=>setConfirm(e.target.value)}
        placeholder="Confirmar contraseña"
        required
        minLength={8}
        className="w-full mb-3 p-2 rounded border"
      />
      <button disabled={loading} type="submit" className="w-full bg-vita-orange text-white font-bold py-2 rounded">
        {loading ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}
