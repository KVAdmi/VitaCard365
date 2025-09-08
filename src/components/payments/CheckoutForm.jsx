
export default function CheckoutForm() {
  return (
    <div className="glass-card p-6 rounded-2xl shadow-lg flex flex-col gap-4 items-center w-full max-w-md mx-auto">
      <div className="text-yellow-400 text-center text-lg font-bold mb-4">Pasarela de pago en migración</div>
      <div className="text-white/80 text-center mb-4">Pronto activaremos Mercado Pago. Por ahora, los pagos están deshabilitados.</div>
      <div className="w-full flex justify-center">
        <button className="w-full bg-gray-400 text-white py-3 rounded-lg font-bold text-lg shadow-md opacity-50 cursor-not-allowed" disabled>
          Pago deshabilitado
        </button>
      </div>
    </div>
  );
}

