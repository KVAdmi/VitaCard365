import { Capacitor } from '@capacitor/core';
const isIOS = Capacitor.getPlatform() === 'ios';
import React, { useEffect, useMemo, useState } from 'react';
import AnimatedStats from '../components/dashboard/AnimatedStats';
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
  Leaf,
  Dumbbell,
  Wallet as WalletIcon,
  Lock,
  Brain
} from 'lucide-react';


const Dashboard = () => {
  const navigate = useNavigate();
  const { user, access } = useAuth();

  const [logros, setLogros] = useState([]);
  const [rutinasCompletadas, setRutinasCompletadas] = useState(0);
    const [showPolicy, setShowPolicy] = useState(false);


  useEffect(() => {
    // Simulación de logros y rutinas completadas
    setLogros(['Primera rutina completada', '5 días consecutivos']);
    setRutinasCompletadas(12); // Número simulado
  }, []);

  // Accesos rápidos: cards en orden (Coberturas, FIT, Mi Chequeo, Bienestar)
  const quickActions = [
    { title: 'Coberturas', icon: Shield, path: '/coberturas' },
    { title: 'Fitness', icon: Dumbbell, path: '/fit' },
  { title: 'Mi Chequeo', icon: Heart, path: '/mi-chequeo' },
  { title: 'Bienestar', icon: Brain, path: '/bienestar' },
    { title: 'Eco', icon: Leaf, path: '/eco' },
    { title: 'Wallet', icon: WalletIcon, path: '/perfil/wallet', locked: true }
  ];

  const planStatus = useMemo(() => {
    if (!access) return { status: 'Pendiente', color: 'text-yellow-400', message: 'Verificando tu plan…' };
    const ep = (access.estado_pago || '').toLowerCase();
    if (ep === 'cancelado') return { status: 'Cancelado', color: 'text-red-500', message: 'Tu plan ha sido cancelado.' };
    if (ep === 'vencido') return { status: 'Suspendido', color: 'text-orange-400', message: 'Tu pago está vencido.' };
  if (access.activo) return { status: 'Activo', color: 'text-green-400', message: 'Todo en orden con tu plan.' };
    return { status: 'Pendiente', color: 'text-yellow-400', message: 'Activa tu plan para empezar.' };
  }, [access]);

  const alias = user?.user_metadata?.alias || user?.user_metadata?.name?.split(' ')[0] || 'Usuario';

  return (
    <>
      <Helmet>
        <title>Dashboard - Vita365</title>
        <meta name="description" content="Panel principal de Vita365. Accede a tus coberturas, monitoreo de salud, agenda y más funciones de bienestar." />
      </Helmet>

      <Layout title="Inicio">
        <div className="p-4 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="border border-cyan-300/20 bg-white/10 text-white" style={{boxShadow:'0 0 0 1px rgba(0,255,231,0.28)'}}>
              <CardContent className="p-6 pt-6" style={{ paddingTop: isIOS ? 24 : 8 }}>
                <h2 className="text-2xl font-bold drop-shadow-[0_0_8px_rgba(0,255,231,0.3)]">¡Hola, {alias}!</h2>
                <p className="text-white/80">Bienvenido a tu panel de control.</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            className="cursor-pointer"
            onClick={() => navigate('/mi-plan')}
          >
            <style>{`@keyframes navyGlow {0%,100%{filter:drop-shadow(0 0 10px rgba(0,150,255,0.18))}50%{filter:drop-shadow(0 0 16px rgba(0,150,255,0.28))}}`}</style>
            <Card className="glass-card flex items-center justify-center p-6" style={{border:'1px solid rgba(0,150,255,0.25)'}}>
              <img src="/branding/Logo 2 Vita.png" alt="VitaCard 365" className="w-full max-w-[720px] sm:max-w-[820px] object-contain" style={{animation:'navyGlow 2.8s ease-in-out infinite'}} />
            </Card>
          </motion.div>

          {/* Bienvenida calurosa bajo el logo (sin repetir el nombre) */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
            <style>{`@keyframes crystalGlow {0%,100%{box-shadow:0 0 0 1px rgba(0,255,231,0.28),0 0 16px rgba(0,255,231,0.14)}50%{box-shadow:0 0 0 1px rgba(0,255,231,0.5),0 0 24px rgba(0,255,231,0.24)}}`}</style>
            <Card className="border border-cyan-300/25 bg-white/10 text-white" style={{animation:'crystalGlow 2.8s ease-in-out infinite', borderRadius: 16}}>
              <CardContent className="px-6 py-7">
                <h3 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight drop-shadow-[0_0_10px_rgba(0,255,231,0.35)]">¡Qué gusto tenerte aquí!</h3>
                <p className="text-white/90 leading-relaxed text-base">
                  Tienes todo en un solo lugar: mediciones, entrenamientos y coberturas que te respaldan 24/7. Esta app está diseñada para acompañarte y ayudarte siempre.
                </p>
              </CardContent>
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center justify-center space-y-3 p-6 sm:p-6 rounded-2xl glass-card cursor-pointer transition-all shadow-lg border border-white/10"
                  style={{ minHeight: '120px', minWidth: '110px', boxShadow: '0 4px 24px 0 rgba(96,165,250,0.10)' }}
                >
                  <div className="w-16 h-16 sm:w-16 sm:h-16 flex items-center justify-center rounded-full shadow-lg relative" style={{ backgroundColor: '#f06340' }}>
                    <action.icon className="h-10 w-10 sm:h-10 sm:w-10 text-white" />
                    {action.locked && (
                      <Lock className="h-4 w-4 text-white/90 absolute -right-1 -top-1 drop-shadow" />
                    )}
                  </div>
                  <p className="text-base sm:text-base font-semibold text-center text-vita-white">{action.title}</p>
                </motion.div>
              ))}
            </div>
            {/* Eliminado botón extra, FIT ahora es card */}
          </div>

          {/** Tarjeta de texto promocional removida por solicitud del usuario **/}

          <div className="mt-2 flex justify-center w-full">
            <Card className="bg-white/10 border border-white/10 shadow-lg flex flex-col items-center w-auto">
              <CardHeader className="py-2 px-4 w-full">
                <CardTitle className="text-base sm:text-xl font-bold text-vita-white/90 text-center w-full mb-2 mt-4">Nuestros Resultados</CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0 flex justify-center items-center w-full">
                <AnimatedStats />
              </CardContent>
            </Card>
          </div>


          {/* Firma del desarrollador (fuera de la tarjeta, sobre el fondo) */}
          <div className="w-full flex justify-center mt-6 mb-8">
            <p className="text-[12px] leading-none text-white/90 tracking-wide">® Kódigo Vivo. Tecnología patentada.</p>
          </div>
          <div className="w-full flex justify-center mb-2">
            <button
              className="text-[12px] leading-none text-white/90 tracking-wide underline cursor-pointer bg-transparent border-none p-0"
              style={{ outline: 'none' }}
              onClick={() => setShowPolicy(true)}
            >
              Política de Seguridad y Confidencialidad de Datos
            </button>
          </div>
          {showPolicy && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
              onClick={() => setShowPolicy(false)}
            >
              <div
                className="rounded-2xl p-6 max-w-lg w-full glass-card border border-white/20 shadow-2xl relative"
                style={{ background: 'rgba(30, 30, 40, 0.92)', color: 'white', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.32)', maxHeight: '80vh', overflowY: 'auto' }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  className="absolute top-3 right-3 text-white/80 hover:text-white text-2xl font-bold bg-transparent border-none cursor-pointer"
                  style={{ outline: 'none', zIndex: 10 }}
                  onClick={() => setShowPolicy(false)}
                  aria-label="Cerrar política"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <h2 className="text-xl font-bold mb-4 text-white text-center">Política de Seguridad y Confidencialidad de Datos</h2>
                <div className="space-y-2 text-sm text-white/90">
                  <p>En VitaCard365, la protección de la información de nuestros usuarios es una prioridad absoluta. Nuestra plataforma está diseñada bajo los más altos estándares de seguridad y privacidad, garantizando que los datos personales sean tratados con estricta confidencialidad y conforme a la legislación vigente.</p>
                  <ol className="list-decimal pl-4 space-y-2">
                    <li>No almacenamos datos de medios de pago: Todas las transacciones y operaciones relacionadas con pagos se gestionan exclusivamente a través de Mercado Pago. VitaCard365 no almacena, procesa ni tiene acceso a información sensible de tarjetas, cuentas bancarias o cualquier otro medio de pago.</li>
                    <li>No transferimos ni vendemos datos de usuarios: La información personal proporcionada por nuestros usuarios nunca es transferida, compartida ni vendida a terceros bajo ninguna circunstancia. El acceso a los datos está restringido únicamente para fines operativos internos y conforme a lo permitido por el usuario.</li>
                    <li>Encriptación y seguridad máxima: Todos los datos gestionados por VitaCard365 son encriptados utilizando tecnologías de seguridad de nivel empresarial, tanto en tránsito como en reposo. Implementamos medidas de protección avanzadas para prevenir accesos no autorizados, pérdida, alteración o divulgación de la información.</li>
                    <li>Cumplimiento normativo: Nuestra plataforma cumple con las regulaciones aplicables en materia de protección de datos personales, incluyendo la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y estándares internacionales de seguridad.</li>
                    <li>Transparencia y control: El usuario tiene pleno control sobre su información y puede solicitar en cualquier momento la revisión, actualización o eliminación de sus datos enviando una solicitud al correo <a href="mailto:contacto@vitacard365.com" className="underline text-white" style={{textDecorationColor:'#fff'}}>contacto@vitacard365.com</a>, conforme a los procedimientos establecidos.</li>
                    <li>Identidad corporativa: VitaCard365 es un producto de Azisted S.A. de C.V. Las coberturas de asistencia ofrecidas en la plataforma son operadas por IGS Group Solution.</li>
                  </ol>
                  <p>Para cualquier consulta o solicitud relacionada con la protección de datos, ponemos a disposición nuestros canales de contacto y atención.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default Dashboard;