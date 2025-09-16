import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function HistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) { setErr("Sin sesión"); setLoading(false); return; }

        const { data, error } = await supabase
          .from("v_history_measurements")
          .select("*")
          .eq("user_id", user.id)
          .order("taken_at", { ascending: false });

        if (error) throw error;
        setRows(data || []);
      } catch (e: any) {
        setErr(e.message);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="p-4 text-white">Cargando…</div>;
  if (err) return <div className="p-4 text-red-300">Error: {err}</div>;
  if (!rows.length) return <div className="p-4 text-white/70">Sin mediciones aún.</div>;

  return (
    <div className="p-4 text-white">
      <h1 className="text-xl font-semibold mb-3">Historial</h1>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="rounded-lg border border-white/10 p-3">
            <div className="flex justify-between">
              <div className="font-medium">{label(r.type)}: {fmt(r.value, r.type)}</div>
              <div className="text-xs opacity-70">{new Date(r.taken_at).toLocaleString()}</div>
            </div>
            <div className="text-xs opacity-60">Fuente: {r.source}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function label(t: string) {
  switch (t) {
    case "sistolica": return "Presión sistólica";
    case "diastolica": return "Presión diastólica";
    case "pulso_bpm": return "Pulso";
    case "spo2": return "SpO₂";
    case "peso_kg": return "Peso";
    default: return t;
  }
}
function fmt(v: number, t: string) {
  if (t === "pulso_bpm") return `${Math.round(v)} BPM`;
  if (t === "spo2") return `${v}%`;
  if (t === "peso_kg") return `${v} kg`;
  return `${Math.round(v)} mmHg`;
}