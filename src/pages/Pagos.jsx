import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, ArrowRight, User, Users, CalendarDays, ShieldQuestion } from 'lucide-react';

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
          
          <Button onClick={() => navigate('/payment-gateway')} size="lg" className="w-full">
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