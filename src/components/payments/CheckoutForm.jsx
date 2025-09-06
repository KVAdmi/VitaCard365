import { PaymentElement } from "@stripe/react-stripe-js";

import { useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";

// PaymentElement no requiere opciones de estilo personalizadas

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: "http://localhost:5173/success",
      },
    });
    if (error) {
      setError(error.message);
      console.error(error.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl shadow-lg flex flex-col gap-4 items-center w-full max-w-md mx-auto">
      <PaymentElement className="mb-4" />
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-vita-orange hover:bg-orange-500 transition-colors text-white py-3 rounded-lg font-bold text-lg shadow-md disabled:opacity-50"
      >
        {loading ? "Procesando..." : "Pagar"}
      </button>
    </form>
  );
};

export default CheckoutForm;

