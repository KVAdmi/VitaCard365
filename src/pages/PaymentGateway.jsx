// src/pages/PaymentGateway.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { usePayment } from "../hooks/usePayment";
import { createPreference } from "../lib/api";
import Layout from "../components/Layout";
// import MPWallet from "../components/payments/MPWallet.jsx";
// Nota: pantalla estabilizada sin lógica de códigos aplicada

export default function PaymentGateway() {
  const navigate = useNavigate();

  console.log(">>> Estoy en PaymentGateway REAL");

  useEffect(() => {
    try {
      const kvGate = sessionStorage.getItem("kv_gate") === "1";
      if (kvGate) {
        console.info("[KV] kv_gate=1 → redirijo a /mi-plan (imperativo)");
        window.location.href = "/mi-plan";
      }
    } catch (e) {
      console.warn("[KV] sessionStorage no disponible:", e);
    }
  }, []);

  const kvGate = typeof window !== 'undefined' && sessionStorage.getItem('kv_gate') === '1';
  if (kvGate) {
    console.info('[KV] Bloqueando pago por kv_gate=1 -> /mi-plan');
    return <Navigate to="/mi-plan" replace />;
  }

  // Definir membership ANTES de usePayment para evitar undefined en render
  const [membership, setMembership] = useState({ acceso_activo: false, periodicidad: null, membresia: null });
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
    isVitalicio,
    chargedFamilySize,
  } = usePayment({ membership });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUpsell, setShowUpsell] = useState(false);
  // Preferencia: recibir certificado por correo
  const [sendCertByEmail, setSendCertByEmail] = useState(true);
  // Sin campos de código promocional en esta versión

  // Cargar estado de membresía y mostrar mensajes especiales
  useEffect(() => { (async()=>{
    try{
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from('profiles_certificado_v2')
        .select('acceso_activo, periodicidad, membresia')
        .eq('user_id', uid)
        .maybeSingle();
      if (data) setMembership({ acceso_activo: !!data.acceso_activo, periodicidad: data.periodicidad, membresia: data.membresia });
      // Si vitalicio, no mostrar pago
      if (data?.periodicidad === 'vitalicio') {
        setShowVitalicio(true);
      }
    }catch{}
  })(); }, []);

  const [showVitalicio, setShowVitalicio] = useState(false);

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

    // Upsell temporal: solo cuando es plan individual y no vitalicio
    let timer;
    if (planType === 'individual' && !showVitalicio) {
      setShowUpsell(true);
      timer = setTimeout(() => setShowUpsell(false), 3500);
    } else {
      setShowUpsell(false);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [planType, familySize, frequency, totalAmount, showVitalicio]);

  // Total como estaba originalmente
  const amountToCharge = Number(totalAmount);

  const onGenerate = async () => {
    try {
      setError(null);
      setLoading(true);

  // Validar y procesar monto (comportamiento original)
  const baseRaw = String(totalAmount).replace(/[^\d.]/g, '');
  const finalAmount = parseFloat(baseRaw);
      
      if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
        console.error("[Gateway] Monto inválido:", totalAmount);
        setError("Error en el cálculo del monto. Recarga la página.");
        return;
      }

      // Asegurar 2 decimales exactos
      const amount = Math.round(finalAmount * 100) / 100;
      console.log("[PAY] amount:", amount, typeof amount);

      // Payload para el backend (original): enviamos amount calculado en cliente
      const requestData = {
        plan: planType,
        frequency: paymentFrequencies[frequency].label,
        familySize: Number(familySize || 1),
        amount,
        // Campo informativo no disruptivo; backend puede ignorar si no lo soporta
        sendCertByEmail: !!sendCertByEmail
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
        {/* Mensaje para vitalicio */}
        {showVitalicio && (
          <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-emerald-200">
            Tu membresía es vitalicia. No necesitas realizar pagos. ¡Disfruta de tus beneficios!
          </div>
        )}

        {/* Upsell para plan individual (aparece 3.5s y se oculta) */}
        {planType === 'individual' && !showVitalicio && showUpsell && (
          <div className="mb-4 rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-3 text-cyan-100/90">
            Protege a tu familia y aprovecha los descuentos del plan familiar. ¡Añade miembros con tarifa preferencial!
          </div>
        )}
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
                  value={Math.max(0, (familySize - 1) - (isVitalicio ? 1 : 0))}
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
                Total a cobrar: {chargedFamilySize} {chargedFamilySize === 1 ? "persona" : "personas"}
                {isVitalicio && planType==='familiar' && (
                  <span className="text-white/70"> (Titular ya pagado: no se cobra)</span>
                )}
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
          Total a pagar: <span className="text-[#f06340]">${amountToCharge} MXN</span>
        </div>

        {/* Preferencia de envío de certificado por correo */}
        <div className="mb-4 flex items-start gap-2">
          <input
            id="sendCertByEmail"
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={sendCertByEmail}
            onChange={(e) => setSendCertByEmail(e.target.checked)}
          />
          <label htmlFor="sendCertByEmail" className="text-sm text-white/90">
            Quiero recibir mi certificado VitaCard 365 por correo electrónico.
          </label>
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
          {/* Info de promo removida para estabilidad */}
        </div>
        {/* Código promocional: no visible en esta versión */}

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

          {/* Logo Vita y aviso elegante */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <img src="/branding/Logo 2 Vita.png" alt="VitaCard 365" className="h-16 object-contain drop-shadow-[0_0_24px_rgba(240,99,64,0.55)]" />
            <p className="text-xs text-white/80 text-center max-w-md">
              Una vez realizado tu pago, tu póliza y coberturas quedarán activas en un plazo máximo de <span className="text-[#f06340] font-semibold">48 horas</span>. Aquí podrás consultar el estado de activación.
            </p>
          </div>

          <p className="mt-4 text-xs text-white/60 text-center">
            Al confirmar el pago, aceptas los Términos de Servicio y la Política de Privacidad de VitaCard 365.
          </p>

          {/* Facturación */}
          <div className="w-full max-w-2xl mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/90">
            <div className="font-semibold mb-1">¿Requieres factura?</div>
            <p className="text-white/80">
              Envíanos tus datos a <a href="mailto:contacto@vitacard365.com" className="text-[#f06340] underline">contacto@vitacard365.com</a> con:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-white/75">
              <li>Nombre completo o razón social</li>
              <li>Folio iVita</li>
              <li>Monto de compra</li>
              <li>Fecha de pago</li>
            </ul>
            <p className="text-xs text-white/60 mt-2">Te enviaremos tu CFDI conforme a la normativa vigente.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
