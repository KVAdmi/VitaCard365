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
  const [error, setError] = useState(null);
  const [preferenceData, setPreferenceData] = useState(null);

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
      setPreferenceData(null); // Limpiar preferencia anterior
    }
  }, [planType, familySize, frequency, totalAmount]);

  const onGenerate = async () => {
    try {
      setError(null);
      setLoading(true);

      // Validar que el monto sea correcto y convertirlo a número
      const finalAmount = parseFloat(totalAmount);
      if (isNaN(finalAmount) || finalAmount <= 0) {
        console.error("[Gateway] Monto inválido:", totalAmount);
        setError("Error en el cálculo del monto. Por favor, recarga la página.");
        return;
      }

      const requestData = {
        plan: planType,
        frequency,
        familySize,
        amount: finalAmount
      };

      console.log("[Gateway] Generando preferencia con datos:", requestData);

      const response = await createPreference(requestData);

      console.log("[Gateway] Respuesta de preferencia:", response);

      // Validar respuesta
      if (!response || (!response.init_point && !response.sandbox_init_point)) {
        console.error("[Gateway] Respuesta inválida:", response);
        setError("No se pudo generar el enlace de pago. Intenta nuevamente.");
        return;
      }

      // Guardar datos de preferencia para uso posterior si es necesario
      setPreferenceData(response);

      // Redirigir a Mercado Pago
      const checkoutUrl = response.init_point || response.sandbox_init_point;
      console.log("[Gateway] Redirigiendo a:", checkoutUrl);
      
      // Pequeño delay para mostrar feedback al usuario
      setTimeout(() => {
        window.location.href = checkoutUrl;
      }, 500);

    } catch (error) {
      console.error("[Gateway] Error al generar preferencia:", error);
      
      // Mensajes de error más específicos
      let errorMessage = "No se pudo procesar el pago. ";
      
      if (error.message.includes('Monto inválido')) {
        errorMessage += "Hay un problema con el monto calculado.";
      } else if (error.message.includes('Error del servidor')) {
        errorMessage += "El servidor de pagos no está disponible.";
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage += "Verifica tu conexión a internet.";
      } else {
        errorMessage += "Intenta nuevamente en unos momentos.";
      }
      
      setError(errorMessage);
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
                <div className="flex flex-wrap items-center gap-2 w-full">
                  <div className="flex items-center gap-2 flex-wrap justify-center w-full">
                    <div className="text-sm text-white/80">
                      Titular (1) +
                    </div>
                    <div className="flex items-center gap-2">
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
                          className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors disabled:opacity-50"
                          onClick={() => setFamilySize(prev => Math.min(10, prev + 1))}
                          disabled={loading}
                        >
                          +
                        </button>
                        <button 
                          className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors disabled:opacity-50"
                          onClick={() => setFamilySize(prev => Math.max(2, prev - 1))}
                          disabled={loading}
                        >
                          -
                        </button>
                      </div>
                    </div>
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
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  frequency === key ? "bg-[#f06340] text-white" : "bg-white/10 hover:bg-white/20"
                }`}
                onClick={() => setFrequency(key)}
                disabled={loading}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Total */}
          <div className="text-lg font-semibold mb-4">
            Total a pagar: <span className="text-[#f06340]">${totalAmount} MXN</span>
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
              <span className="text-green-300">- ${breakdown.totalSavings} MXN</span>
            </div>
            <div className="mt-1 text-xs text-white/60">
              {breakdown.months} {breakdown.months === 1 ? "mes" : "meses"} • ${individualPrice} por persona/mes
            </div>
          </div>

          {/* Botón de Mercado Pago */}
          <div className="flex flex-col items-center mt-6 gap-3">
            <MPWallet
              amount={parseFloat(totalAmount)}
              onGenerate={onGenerate} 
              loading={loading}
              error={error}
            />
          </div>
          
          <p className="mt-6 text-xs text-white/60 text-center">
            Al confirmar el pago, aceptas los Términos de Servicio y la Política de Privacidad de VitaCard 365.
          </p>
        </div>
      </div>
    </div>
  );
}
