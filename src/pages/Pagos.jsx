import React, { useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import VitaCard365Logo from '../components/Vita365Logo';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, ArrowRight, User, Users, CalendarDays, ShieldQuestion } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE ?? "https://api.vitacard365.com").replace(/\/+$/, "");

const Pagos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  if (!user) {
    return <Layout title="Cargando..."><div className="p-6 text-center">Cargando datos de usuario...</div></Layout>;
  }

  const { paymentDetails, planStatus, name, familyMembers } = user.user_metadata || {};
  const planType = paymentDetails?.plan || 'individual';
  const nextPaymentDate = paymentDetails?.nextPaymentDate ? new Date(paymentDetails.nextPaymentDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric'}) : 'N/A';

  const MemberCard = ({ memberName, isHolder }) => (
    <Card className="bg-white/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-white">{memberName}</p>
            <p className="text-xs text-vita-muted-foreground">{isHolder ? 'Titular del Plan' : 'Miembro'}</p>
          </div>
           <div className="text-right">
              <p className="text-sm font-semibold text-green-400">{planStatus || 'Pendiente'}</p>
              <p className="text-xs text-vita-muted-foreground">Vigencia</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );

  // Referencia para el checkbox
  const notifyRef = useRef();

  // Función para registrar el subscription push y llamar al backend
  async function handlePushNotification() {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const vapidPublicKey = window.VAPID_PUBLIC_KEY || '';
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });
    }
    // Llama al backend para programar la notificación
    await fetch(`${API_BASE}/api/billing/notifications/schedule-renewal-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        nextPaymentDate: paymentDetails?.nextPaymentDate,
        subscription
      })
    });
  }
  return (
    <>
      <Helmet>
        <title>Mi Plan - Vita365</title>
        <meta name="description" content="Consulta los detalles de tu plan Vita365 y gestiona tus pagos." />
      </Helmet>

      <Layout title="Mi Plan" showBackButton>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-4 md:p-6 space-y-6"
        >
          {/* Logo centrado arriba del resumen */}
          <div className="flex justify-center items-center mb-6">
            <VitaCard365Logo className="h-44 w-auto md:h-64" />
          </div>
          <Card className="bg-gradient-to-br from-vita-orange/20 to-vita-blue">
            <CardHeader>
              <CardTitle>Resumen de tu Plan</CardTitle>
              <CardDescription>Aquí puedes ver el estado actual de tu membresía VitaCard 365.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-vita-muted-foreground"><ShieldQuestion className="h-5 w-5" /> Tipo de Plan</span>
                <span className="font-bold text-white capitalize flex items-center gap-2">
                  {planType === 'familiar' ? <Users className="h-5 w-5"/> : <User className="h-5 w-5"/>}
                  {planType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-vita-muted-foreground"><CalendarDays className="h-5 w-5" /> Próximo Pago</span>
                <span className="font-bold text-white">{nextPaymentDate}</span>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-lg font-bold text-white mb-3">Miembros del Plan</h3>
            <div className="space-y-3">
              <MemberCard memberName={name} isHolder={true} />
              {planType === 'familiar' && familyMembers?.map((member, index) => (
                <MemberCard key={index} memberName={member.name || `Miembro ${index + 1}`} isHolder={false} />
              ))}
            </div>
          </div>

          {/* Notificación de vencimiento */}
          <div className="mt-6 p-4 rounded-xl bg-white/10 border border-white/20">
            <label className="flex items-center gap-2 cursor-pointer">
              <input ref={notifyRef} type="checkbox" className="accent-orange-500 h-5 w-5" onChange={async e => {
                if (e.target.checked) {
                  if (window.solicitarPermisoPush) {
                    window.solicitarPermisoPush();
                  } else if ('Notification' in window) {
                    await Notification.requestPermission();
                  }
                  await handlePushNotification();
                }
              }} />
              <span className="text-white text-sm">Notificarme antes del vencimiento de mi plan</span>
            </label>
            <p className="text-xs text-white/60 mt-2">Activa esta opción para recibir un aviso antes de que expire tu plan y no perder la cobertura.</p>
          </div>
          
          <Button onClick={() => navigate('/payment-gateway')} size="lg" className="w-full" style={{ backgroundColor: '#f06340', color: '#fff' }}>
            <ShieldCheck className="mr-2 h-5 w-5" />
              Pagar o cambiar plan
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

        </motion.div>
      </Layout>
    </>
  );
};

export default Pagos;