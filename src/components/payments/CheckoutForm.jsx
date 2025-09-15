import MPWallet from './MPWallet';

export default function CheckoutForm({ plan = 'Individual', frequency = 'Mensual', amount = 199 }) {
  return (
    <div className="glass-card p-6 rounded-2xl shadow-lg flex flex-col gap-4 items-center w-full max-w-md mx-auto">
      <div className="text-blue-600 text-center text-lg font-bold mb-4">Paga con Mercado Pago</div>
      <div className="text-white/80 text-center mb-4">Tu pago es seguro.</div>
  {/* Eliminado: MPWallet solo se renderiza en PaymentGateway.jsx para evitar duplicados */}
    </div>
  );
}

