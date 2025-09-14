

import { useEffect, useRef, useState } from "react";

function waitForMPSDK(maxMs = 4000, intervalMs = 50) {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) return resolve(true);
    const script = document.getElementById("mp-sdk");
    let waited = 0;
    const onLoad = () => resolve(true);
    if (script) script.addEventListener("load", onLoad, { once: true });

    const t = setInterval(() => {
      if (window.MercadoPago) {
        clearInterval(t);
        script?.removeEventListener("load", onLoad);
        resolve(true);
      } else if ((waited += intervalMs) >= maxMs) {
        clearInterval(t);
        script?.removeEventListener("load", onLoad);
        reject(new Error("sdk_not_loaded_timeout"));
      }
    }, intervalMs);
  });
}

export default function MPWallet({ preferenceId }) {
  const createdRef = useRef(false);
  const controllerRef = useRef(null);
  const [status, setStatus] = useState("init");
  const CONTAINER_ID = "mp_wallet_container";

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        if (!preferenceId) { setStatus("missing_preference"); return; }
        if (typeof preferenceId !== "string") { setStatus("invalid_preference"); return; }
        if (createdRef.current) return;

        setStatus("waiting_sdk");
        await waitForMPSDK();
        if (cancelled) return;

        setStatus("creating");
        const mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, { locale: "es-MX" });
        const bricks = mp.bricks();

        // PASA EL ID STRING, NO EL ELEMENTO
        controllerRef.current = await bricks.create("wallet", CONTAINER_ID, {
          initialization: { preferenceId },
          customization: { texts: { valueProp: "security_details" } },
        });

        if (!cancelled) { createdRef.current = true; setStatus("ready"); }
      } catch (e) {
        console.error("[MP wallet brick] error:", e);
        if (!cancelled) setStatus(e?.message === "sdk_not_loaded_timeout" ? "sdk_not_loaded" : "error");
      }
    };

    start();
    return () => {
      cancelled = true;
      // desmonta si el SDK alcanzó a crear algo
      try { controllerRef.current?.unmount?.(); } catch {}
    };
  }, [preferenceId]);

  return (
    <div className="w-full">
      {/* el ID debe existir y ser ÚNICO */}
      <div id={CONTAINER_ID} />
      {status !== "ready" && (
        <div className="mt-2 text-xs text-slate-400">
          {status === "waiting_sdk" && "Cargando SDK…"}
          {status === "creating" && "Inicializando pago…"}
          {status === "sdk_not_loaded" && "SDK no disponible (revisa <script> o CSP)."}
          {status === "missing_preference" && "Sin preferenceId."}
          {status === "invalid_preference" && "preferenceId inválido (debe ser string)."}
          {status === "error" && "No se pudo crear el Wallet. Revisa consola."}
        </div>
      )}
    </div>
  );
}

