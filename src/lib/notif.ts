import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side
);

// Inserta registro si no existe por (tipo, referencia_id)
export async function onceInsert(opts: {
  tipo: "confirmacion_pago" | "bienvenida";
  referencia_id: string; // paymentId para confirmación; userId para bienvenida
  user_id: string;
  payload?: any;
  meta?: any;
}): Promise<boolean> {
  const { error } = await supabase
    .from("notif_emails")
    .insert({
      tipo: opts.tipo,
      referencia_id: opts.referencia_id,
      user_id: opts.user_id,
      payload: opts.payload ?? {},
      meta: opts.meta ?? {}
    });

  // 23505 = duplicate key (UNIQUE), entonces ya existía
  if (error && (error as any).code === "23505") return false;
  if (error) throw error;
  return true;
}

export { supabase };
