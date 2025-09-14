// src/pages/PaymentGateway.jsx
import { useEffect, useRef, useState } from "react";
import { usePayment } from "../hooks/usePayment";
import MPWallet from "../components/payments/MPWallet.jsx";
import { createPreference } from "../lib/api";

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

  const [preferenceId, setPreferenceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // desmontar el brick si cambian selecciones (evita duplicados)
  const last = useRef({ planType, familySize, frequency });
  useEffect(() => {
    const changed =
      last.current.planType !== planType ||
      last.current.familySize !== familySize ||
      last.current.frequency !== frequency;

    if (changed) {
      last.current = { planType, familySize, frequency };
      if (preferenceId) setPreferenceId(null);
    }
  }, [planType, familySize, frequency, preferenceId]);

  const onGenerate = async () => {
    try {
      setErr(null);
      setLoading(true);
      setPreferenceId(null);

      const { preferenceId: pid } = await createPreference({
        plan: planType,
        frequency,
        familySize,
        unit_price: Number(totalAmount.replace(/,/g, '.')), // asegura número decimal
      });

      setPreferenceId(typeof pid === "string" ? pid : null);
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
              onClick={() => { setPlanType("individual"); if (preferenceId) setPreferenceId(null); }}
            >
              Individual
            </button>
            <button
              className={`px-3 py-1.5 rounded-full text-sm ${
                planType === "familiar" ? "bg-[#f06340] text-white" : "bg-white/10"
              }`}
              onClick={() => { setPlanType("familiar"); if (preferenceId) setPreferenceId(null); }}
            >
              Familiar
            </button>

            {planType === "familiar" && (
              <div className="ml-auto flex flex-col items-end">
                <label className="mr-2 text-sm text-white/80">Integrantes</label>
                <input
                  type="number"
                  min={2}
                  value={familySize}
                  onChange={(e) => { setFamilySize(Number(e.target.value)); if (preferenceId) setPreferenceId(null); }}
                  className="w-20 rounded-md bg-white/10 border border-white/10 px-2 py-1 text-sm focus:outline-none"
                />
                <span className="mt-1 text-xs text-yellow-300 text-right max-w-xs">
                  Ingresa el total de personas (titular + familiares). Ejemplo: 3 = tú + 2 familiares.<br/>
                  Se generará un folio VITAFAM para tu grupo.
                </span>
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
                onClick={() => { setFrequency(key); if (preferenceId) setPreferenceId(null); }}
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

          {/* Botón para crear preferencia */}
          <div className="flex flex-col items-center mt-6 mb-2">
            <button
              onClick={onGenerate}
              disabled={loading}
              className="rounded-lg px-4 py-2 font-semibold disabled:opacity-60 w-48 text-center"
              style={{ backgroundColor: '#f06340', color: '#fff' }}
            >
              {loading ? "Preparando pago…" : "Generar pago"}
            </button>
            {err && <span className="text-rose-400 text-sm mt-2">{err}</span>}
          </div>

          {/* Wallet (un solo brick por preferencia) */}
          <div className="mt-6">
            {typeof preferenceId === "string" && (
              <MPWallet key={preferenceId} preferenceId={preferenceId} />
            )}
          </div>

          <p className="mt-6 text-xs text-white/60">
            Al confirmar el pago, aceptas los Términos de Servicio y la Política de Privacidad de VitaCard 365.
          </p>
        </div>
      </div>
    </div>
  );
}
