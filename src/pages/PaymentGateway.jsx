import React, { useEffect, useState, useMemo } from 'react';

// Fallback para API_BASE
const API_BASE = import.meta.env.VITE_API_BASE ?? "https://api.vitacard365.com";
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { usePayment } from '../hooks/usePayment';
import { Users, User, ArrowRight, Loader2, Minus, Plus, Calendar, Percent, Tag, ShieldCheck, Lock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import CheckoutForm from '../components/payments/CheckoutForm';
import MPWallet from '../components/payments/MPWallet';


const PaymentGateway = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    planType, setPlanType,
    familySize, setFamilySize,
    frequency, setFrequency,
    totalAmount,
    familyDiscount,
    frequencyDiscount,
    paymentFrequencies,
  } = usePayment();

  const [preferenceId, setPreferenceId] = useState(null);
  const onceRef = React.useRef(false);

  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;
    setPreferenceId(null);

    const fetchPreference = async () => {
      if (!API_BASE) {
        console.error("[PG] API_BASE faltante");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/payments/preference`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: planType,
            frequency,
            amount: totalAmount,
            familySize,
          }),
          credentials: "include",
        });
        const data = await res.json();
        const id = data.preferenceId || data.preference_id || data.id;
        if (id) setPreferenceId(id);
      } catch (e) {
        // Opcional: console.error("Error al crear preferencia:", e);
      }
    };
    fetchPreference();
  }, [planType, frequency, totalAmount, familySize]);

  return (
    <>
      <Helmet>
        <title>Pasarela de Pago - Vita365</title>
        <meta name="description" content="Elige tu método de pago preferido para tu plan Vita365." />
      </Helmet>

      <Layout title="Pasarela de Pago" showBackButton>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-4 md:p-6 space-y-6"
        >
          {/* ...existing code... */}

          <div className="flex items-center justify-center p-8">
            <CheckoutForm 
              plan={planType || 'Individual'}
              frequency={frequency || 'Mensual'}
              amount={totalAmount || 199}
            />
          </div>

          {/* Renderiza MPWallet solo si preferenceId existe */}
          {preferenceId && (
            <div className="flex items-center justify-center p-8">
              <MPWallet preferenceId={preferenceId} />
            </div>
          )}

          <p className="text-center text-xs text-white/50 mt-4">
            Al confirmar el pago, aceptas los <a href="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" className="underline">Términos de Servicio</a> y la <a href="/politicas-de-privacidad" target="_blank" rel="noopener noreferrer" className="underline">Política de Privacidad</a> de VitaCard 365.
          </p>

        </motion.div>
      </Layout>
    </>
  );
};

export default PaymentGateway;

