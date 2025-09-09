import React, { useEffect, useState, useMemo } from 'react';
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

          <div className="flex items-center justify-center p-8">
            <CheckoutForm 
              plan={planType || 'Individual'}
              frequency={frequency || 'Mensual'}
              amount={totalAmount || 199}
            />
          </div>

          <p className="text-center text-xs text-white/50 mt-4">
            Al confirmar el pago, aceptas los <a href="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" className="underline">Términos de Servicio</a> y la <a href="/politicas-de-privacidad" target="_blank" rel="noopener noreferrer" className="underline">Política de Privacidad</a> de VitaCard 365.
          </p>

        </motion.div>
      </Layout>
    </>
  );
};

export default PaymentGateway;

