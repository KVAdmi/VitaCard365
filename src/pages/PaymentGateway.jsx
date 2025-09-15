// src/pages/PaymentGateway.jsx
import { useEffect, useRef, useState } from "react";
import { usePayment } from "../hooks/usePayment";
import { createPreference } from "../lib/api";
import MPWallet from "../components/payments/MPWallet.jsx";

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
  const [err, setErr] = useState(null);

  // Cuando cambie la selección, no necesitamos mantener nada del brick
  const last = useRef({ planType, familySize, frequency, totalAmount });
  useEffect(() => {
    const changed =
      last.current.planType !== planType ||
      last.current.familySize !== familySize ||
      last.current.frequency !== frequency ||
      last.current.totalAmount !== totalAmount;
    if (changed) {
      last.current = { planType, familySize, frequency, totalAmount };
      setErr(null);
    }
  }, [planType, familySize, frequency, totalAmount]);

  const onGenerate = async () => {
    try {
      setErr(null);
      setLoading(true);

      // Validar que el monto sea correcto y convertirlo a número
      const finalAmount = parseFloat(totalAmount);
      if (isNaN(finalAmount) || finalAmount <= 0) {
        console.error("[Gateway] monto inválido:", totalAmount);
        setErr("Error en el cálculo del monto.");
        return;
      }

      console.log("[Gateway] Enviando datos:", {
        plan: planType,
        frequency,
        familySize,
        amount: finalAmount,
        breakdown
      });

      const res = await createPreference({
        plan: planType,
        frequency,
        familySize,
        amount: finalAmount
      });

      console.log("[Gateway] Respuesta MP:", res);

      // Obtener la URL de redirección y asegurarnos de que existe
      if (!res || (!res.init_point && !res.sandbox_init_point)) {
        console.error("[Gateway] Respuesta inválida de MP:", res);
        setErr("No se pudo generar el enlace de pago.");
        return;
      }

      // Usar la URL de sandbox en desarrollo, production en producción
      const checkoutUrl = res.init_point || res.sandbox_init_point;
      window.location.href = checkoutUrl;
    } catch (e) {
      console.error("[Gateway] preference error:", e);
      setErr("No se pudo preparar el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1a2b] text-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Pasarela de Pago</h1>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          {/* Plan */}
          <div className="flex items-center gap-4 mb-4">
            <button
              className={`px-3 py-1.5 rounded-full text-sm ${
                planType === "individual" ? "bg-[#f06340] text-white" : "bg-white/10"
              }`}
              onClick={() => setPlanType("individual")}
            >
              Individual
            </button>
            <button
              className={`px-3 py-1.5 rounded-full text-sm ${
                planType === "familiar" ? "bg-[#f06340] text-white" : "bg-white/10"
              }`}
              onClick={() => setPlanType("familiar")}
            >
              Familiar
            </button>

            {planType === "familiar" && (
              <div className="ml-auto flex flex-col items-end">
                <label className="mr-2 text-sm text-white/80">Familiares adicionales</label>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-white/80 mr-2">
                    Titular (1) +
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={familySize - 1}
                    readOnly
                    className="w-12 rounded-md bg-white/10 border border-white/10 px-2 py-1 text-sm focus:outline-none text-center"
                  />
                  <div className="flex gap-1">
                    <button 
                      className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center"
                      onClick={() => setFamilySize(prev => Math.min(10, prev + 1))}
                    >
                      +
                    </button>
                    <button 
                      className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center"
                      onClick={() => setFamilySize(prev => Math.max(2, prev - 1))}
                    >
                      -
                    </button>
                  </div>
                </div>
                <div className="text-xs text-green-300 mt-1">
                  Total: {familySize} {familySize === 1 ? 'persona' : 'personas'} (Titular + {familySize - 1} familiares)
                </div>

              </div>
            )}
          </div>

          {/* Frecuencia */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(paymentFrequencies).map(([key, cfg]) => (
              <button
                key={key}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  frequency === key ? "bg-[#f06340] text-white" : "bg-white/10"
                }`}
                onClick={() => setFrequency(key)}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Total */}
          <div className="text-lg font-semibold mb-4">
            Total a pagar: ${totalAmount} MXN
          </div>

          {/* DESGLOSE / AHORROS */}
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
              <span>Descuento por {paymentFrequencies[frequency].label.toLowerCase()} ({frequencyDiscount}%)</span>
              <span>- ${breakdown.freqSavings} MXN</span>
            </div>
            <div className="mt-2 flex justify-between font-semibold">
              <span>Ahorro total</span>
              <span>- ${breakdown.totalSavings} MXN</span>
            </div>
            <div className="mt-1 text-xs text-white/60">
              {breakdown.months} {breakdown.months === 1 ? "mes" : "meses"} • ${individualPrice} por persona/mes
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col items-center mt-6 gap-3">
            <MPWallet
              amount={parseFloat(totalAmount)}
              onGenerate={onGenerate} 
              loading={loading}
              error={err}
            />
          </div>
          <p className="mt-6 text-xs text-white/60">
            Al confirmar el pago, aceptas los Términos de Servicio y la Política de Privacidad de VitaCard 365.
          </p>
        </div>
      </div>
    </div>
  );
}
