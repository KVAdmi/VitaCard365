import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import Layout from '../components/Layout';
import { Card, CardContent, CardTitle, CardHeader } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import VitaCard365Logo from '../components/Vita365Logo';
import { 
  Shield, 
  Heart, 
  Leaf
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const quickActions = [
    { title: 'Coberturas', icon: Shield, path: '/coberturas' },
    { title: 'Mi Chequeo', icon: Heart, path: '/mi-chequeo' },
    { title: 'Bienestar', icon: Leaf, path: '/bienestar' }
  ];

  const planStatus = useMemo(() => {
    if (!user || !user.user_metadata?.paymentDetails?.paymentDate) {
      return { status: 'Pendiente', color: 'text-yellow-400', message: 'Activa tu plan para empezar.' };
    }

    const paymentDate = new Date(user.user_metadata.paymentDetails.paymentDate);
    const now = new Date();
    const daysDiff = (now - paymentDate) / (1000 * 60 * 60 * 24);

    if (daysDiff > 15) {
      return { status: 'Cancelado', color: 'text-red-500', message: 'Tu plan ha sido cancelado.' };
    }
    if (daysDiff > 3) {
      return { status: 'Suspendido', color: 'text-orange-400', message: 'Tu pago está vencido.' };
    }
    return { status: 'Activo', color: 'text-green-400', message: 'Todo en orden con tu plan.' };
  }, [user]);

  const alias = user?.user_metadata?.alias || user?.user_metadata?.name?.split(' ')[0] || 'Usuario';

  return (
    <>
      <Helmet>
        <title>Dashboard - Vita365</title>
        <meta name="description" content="Panel principal de Vita365. Accede a tus coberturas, monitoreo de salud, agenda y más funciones de bienestar." />
      </Helmet>

      <Layout title="Inicio">
        <div className="p-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gradient-to-r from-vita-orange to-orange-500 text-white border-0 shadow-lg shadow-vita-orange/20">
              <CardContent className="p-6 pt-6">
                <h2 className="text-2xl font-bold">
                  ¡Hola, {alias}!
                </h2>
                <p className="text-white/80">Bienvenido a tu panel de control.</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            className="cursor-pointer"
            onClick={() => navigate('/mi-plan')}
          >
            <Card className="glass-card flex items-center justify-center p-4 h-64">
                <VitaCard365Logo className="h-56 w-auto" />
            </Card>
          </motion.div>

          <Card>
            <CardContent className="p-4 pt-4 text-center">
              <p className="text-sm text-vita-muted-foreground">Estado del Plan</p>
              <p className={`text-lg font-bold capitalize ${planStatus.color}`}>{planStatus.status}</p>
              <p className="text-xs text-vita-muted-foreground mt-1">{planStatus.message}</p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-vita-white px-2">Accesos Rápidos</h3>
            <div className="grid grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center justify-center space-y-2 p-4 rounded-2xl glass-card cursor-pointer"
                >
                  <div className="w-12 h-12 bg-vita-secondary rounded-full flex items-center justify-center">
                    <action.icon className="h-6 w-6 text-vita-orange" />
                  </div>
                  <p className="text-xs font-semibold text-center text-vita-white">{action.title}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Nuestros Resultados</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="bg-black/20 p-4 rounded-lg">
                <img 
                  src="https://horizons-cdn.hostinger.com/968e2ff6-489b-4213-8f79-173bd439ef43/fb52b4ec4915d3a26b3b61eafc277b5e.png" 
                  alt="Datos de impacto de VitaCard 365"
                  className="w-full h-auto rounded-md"
                />
              </div>
            </CardContent>
          </Card>

        </div>
      </Layout>
    </>
  );
};

export default Dashboard;