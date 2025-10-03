// src/pages/PaymentGateway.jsx
import { useEffect, useRef, useState } from "react";
import { usePayment } from "../hooks/usePayment";
import { createPreference } from "../lib/api";
import Layout from "../components/Layout";
// import MPWallet from "../components/payments/MPWallet.jsx";

export default function PaymentGateway() {
  const {
    planType, setPlanType,
    familySize, setFamilySize,
    frequency, setFrequency,
    totalAmount,
    paymentFrequencies,
    familyDiscount,
    frequencyDiscount,
    breakdown,
    individualPrice,
  } = usePayment();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Resetear errores cuando cambie la configuración
  const lastConfig = useRef({ planType, familySize, frequency, totalAmount });
  useEffect(() => {
    const changed =
      lastConfig.current.planType !== planType ||
      lastConfig.current.familySize !== familySize ||
      lastConfig.current.frequency !== frequency ||
      lastConfig.current.totalAmount !== totalAmount;
    
    if (changed) {
      lastConfig.current = { planType, familySize, frequency, totalAmount };
      setError(null);
    }
  }, [planType, familySize, frequency, totalAmount]);

  const onGenerate = async () => {
    try {
      setError(null);
      setLoading(true);

      // Validar y procesar monto
      const rawAmount = String(totalAmount).replace(/[^\d.]/g, '');
      const finalAmount = parseFloat(rawAmount);
      
      if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
        console.error("[Gateway] Monto inválido:", totalAmount);
        setError("Error en el cálculo del monto. Recarga la página.");
        return;
      }

      // Asegurar 2 decimales exactos
      const amount = Math.round(finalAmount * 100) / 100;
      console.log("[PAY] amount:", amount, typeof amount);

      // Payload para el backend: usamos amount (NO unit_price)
      const requestData = {
        plan: planType,
        frequency: paymentFrequencies[frequency].label,
        familySize: Number(familySize || 1),
        amount
      };

      const res = await createPreference(requestData);
      console.log("[Gateway] Respuesta de preferencia:", res);

      if (!res || res.error || !res.init_point) {
        throw new Error((res && res.error) || "Error al crear preferencia");
      }

      // Redirigimos directo al checkout
      window.location.assign(res.init_point);
    } catch (err) {
      console.error("[Gateway] Error al generar preferencia:", err);
      setError("No se pudo procesar el pago. Intenta nuevamente en unos momentos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Pasarela de pago" showBackButton>
  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-6 mx-2 sm:mx-4 my-3">
        {/* Plan */}
        <div className="flex items-center gap-4 mb-4">
          <button
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              planType === "individual" ? "bg-[#f06340] text-white" : "bg-white/10 hover:bg-white/20"
            }`}
            onClick={() => setPlanType("individual")}
            disabled={loading}
          >
            Individual
          </button>

          <button
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              planType === "familiar" ? "bg-[#f06340] text-white" : "bg-white/10 hover:bg-white/20"
            }`}
            onClick={() => setPlanType("familiar")}
            disabled={loading}
          >
            Familiar
          </button>

          {planType === "familiar" && (
            <div className="ml-auto flex flex-col items-end">
              <label className="text-sm text-white/80 mb-2">Familiares adicionales</label>
              <div className="flex items-center gap-2">
                <div className="text-sm text-white/80">Titular (1) +</div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  readOnly
                  value={Math.max(0, familySize - 1)}
                  className="w-12 rounded-md bg-white/10 border border-white/10 px-2 py-1 text-sm focus:outline-none text-center text-white"
                />
                <div className="flex gap-1">
                  <button
                    className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors disabled:opacity-50"
                    onClick={() => setFamilySize((prev) => Math.min(10, prev + 1))}
                    disabled={loading}
                  >
                    +
                  </button>
                  <button
                    className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors disabled:opacity-50"
                    onClick={() => setFamilySize((prev) => Math.max(2, prev - 1))}
                    disabled={loading}
                  >
                    –
                  </button>
                </div>
              </div>
              <div className="text-xs text-green-300 mt-1">
                Total: {familySize} {familySize === 1 ? "persona" : "personas"} (Titular + {Math.max(0, familySize - 1)} familiares)
              </div>
            </div>
          )}
        </div>

        {/* Frecuencia */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(paymentFrequencies).map(([key, cfg]) => {
            const active = key === frequency;
            return (
              <button
                key={key}
                className={`px-3 py-1.5 rounded-full text-sm transition ${
                  active ? "bg-[#f06340] text-white" : "bg-white/10 hover:bg-white/20"
                }`}
                onClick={() => setFrequency(key)}
                disabled={loading}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Total */}
        <div className="text-lg font-semibold mb-4">
          Total a pagar: <span className="text-[#f06340]">${totalAmount} MXN</span>
        </div>

        {/* Desglose / Ahorros */}
        <div className="mt-3 rounded-lg bg-white/5 border border-white/10 p-4 text-sm">
          <div className="flex justify-between">
            <span>Precio base</span>
            <span>${breakdown.baseTotal} MXN</span>
          </div>

          {planType === "familiar" && (
            <div className="flex justify-between text-green-300">
              <span>Descuento familiar ({familyDiscount}%)</span>
              <span>- ${breakdown.familySavings} MXN</span>
            </div>
          )}

          <div className="flex justify-between text-green-300">
            <span>
              Descuento por {paymentFrequencies[frequency].label.toLowerCase()} ({frequencyDiscount}%)
            </span>
            <span>- ${breakdown.freqSavings} MXN</span>
          </div>

          <div className="mt-2 flex justify-between font-semibold">
            <span>Ahorro total</span>
            <span className="text-green-300">- ${breakdown.totalSavings} MXN</span>
          </div>

          <div className="mt-1 text-xs text-white/60">
            {breakdown.months} {breakdown.months === 1 ? "mes" : "meses"} • ${individualPrice} por persona/mes
          </div>
        </div>

        {/* Pago */}
        <div className="flex flex-col items-center mt-6 gap-3">
          <p className="text-white/60">Pago seguro con:</p>

        <button
  onClick={onGenerate}
  disabled={loading}
  className="flex items-center justify-center gap-2 bg-[#fff159] hover:bg-[#ffe600] px-6 py-3 rounded-lg font-semibold text-gray-900 transition w-full max-w-xs disabled:opacity-50"
>
  <img
    src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.20.1/mercadopago/logo__large.png"
    alt="Mercado Pago"
    className="h-6"
  />
</button>



          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

          <p className="mt-6 text-xs text-white/60 text-center">
            Al confirmar el pago, aceptas los Términos de Servicio y la Política de Privacidad de VitaCard 365.
          </p>
        </div>
      </div>
    </Layout>
  );
}
