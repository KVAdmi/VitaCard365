import React, { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/hooks/usePayment';
import { Users, User, ArrowRight, Loader2, Minus, Plus, Calendar, Percent, Tag, ShieldCheck, Lock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import CheckoutForm from '@/components/payments/CheckoutForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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

  const [selectedGateway, setSelectedGateway] = useState('stripe');
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(false);
  const priceId = 'price_1S3kOtGr10a3liepEMoWFNkL'; // tu priceId

  useEffect(() => {
    // Pago único: obtener email y monto
    const email = user?.email || 'test@example.com';
    setLoading(true);
    // Validar y convertir el monto a centavos (entero)
    let amountInCents = 0;
    if (totalAmount && !isNaN(totalAmount)) {
      amountInCents = Math.round(Number(totalAmount) * 100);
    }
    if (amountInCents <= 0) {
      console.error('Monto inválido para Stripe:', totalAmount);
      setLoading(false);
      return;
    }
    fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, amount: amountInCents })
    })
      .then(res => res.json())
      .then(({ clientSecret }) => {
        setClientSecret(clientSecret);
        setLoading(false);
      })
      .catch(err => {
        console.error('create-intent error', err);
        setLoading(false);
      });
  }, [totalAmount, user]);

  const appearance = useMemo(() => ({
    theme: 'night',
    variables: {
      colorText: '#ffffff',
      colorTextSecondary: '#cbd5e1',
      colorBackground: '#0b1530',
      colorDanger: '#ef4444',
      borderRadius: '12px',
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial',
    }
  }), []);

  const options = useMemo(() => {
    if (!clientSecret) {
      return undefined;
    }
    return { clientSecret, appearance, locale: 'es' };
  }, [clientSecret, appearance]);

// Depuración: Verifica valores antes de renderizar
  useEffect(() => {
    if (clientSecret) {
      console.log('clientSecret listo:', clientSecret);
      console.log('options:', options);
    }
  }, [clientSecret, options]);

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
          <Tabs value={planType} onValueChange={setPlanType} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual" className="flex items-center gap-2"><User className="h-4 w-4" /> Individual</TabsTrigger>
              <TabsTrigger value="familiar" className="flex items-center gap-2"><Users className="h-4 w-4" /> Familiar</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Tabs value={frequency} onValueChange={setFrequency} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {Object.entries(paymentFrequencies).map(([key, { label }]) => (
                <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {planType === 'familiar' && (
            <Card>
              <CardHeader>
                <CardTitle>Miembros de la Familia</CardTitle>
                <CardDescription>Selecciona cuántos miembros incluir (tú + familiares).</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center gap-4">
                <Button variant="outline" size="icon" onClick={() => setFamilySize(familySize - 1)} disabled={familySize <= 2}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-2xl font-bold w-16 text-center">{familySize}</span>
                <Button variant="outline" size="icon" onClick={() => setFamilySize(familySize + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white/10">
            <CardHeader>
              <CardTitle>Resumen de Compra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center"><p className="flex items-center gap-2"><Tag className="h-4 w-4 text-vita-orange"/>Plan:</p><p className="font-bold capitalize">{planType}</p></div>
              <div className="flex justify-between items-center"><p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-vita-orange"/>Frecuencia:</p><p className="font-bold">{paymentFrequencies[frequency].label}</p></div>
              {planType === 'familiar' && <div className="flex justify-between items-center"><p className="flex items-center gap-2"><Users className="h-4 w-4 text-vita-orange"/>Miembros:</p><p className="font-bold">{familySize}</p></div>}
              {familyDiscount > 0 && <div className="flex justify-between text-green-400"><p className="flex items-center gap-2"><Percent className="h-4 w-4"/>Descuento familiar:</p><p className="font-bold">-{familyDiscount}%</p></div>}
              {frequencyDiscount > 0 && <div className="flex justify-between text-green-400"><p className="flex items-center gap-2"><Percent className="h-4 w-4"/>Descuento por pago:</p><p className="font-bold">-{frequencyDiscount}%</p></div>}
              <div className="border-t border-white/20 my-2"></div>
              <div className="flex justify-between text-2xl">
                <p className="font-bold">Total a Pagar:</p>
                <p className="font-bold text-vita-orange">${totalAmount} MXN</p>
              </div>
            </CardContent>
          </Card>
          
              <Tabs value={selectedGateway} onValueChange={setSelectedGateway} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="stripe">Stripe</TabsTrigger>
                  <TabsTrigger value="paypal" disabled>PayPal</TabsTrigger>
                  <TabsTrigger value="googlepay" disabled>Google Pay</TabsTrigger>
                </TabsList>
              </Tabs>

          {selectedGateway === 'stripe' && (
            !clientSecret ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <p>Cargando pasarela de pago...</p>
              </div>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'flat' }, locale: 'es' }} key={clientSecret}>
                <CheckoutForm />
              </Elements>
            )
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

