import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { User, Briefcase, HeartHandshake } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
const Landing = () => {
  const navigate = useNavigate();
  const handleScroll = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  const handleDownloadApp = () => {
    navigate('/login');
  };
  const handleContact = () => {
    const message = encodeURIComponent("Hola, necesito mas informacion para planes empresariales.");
    window.open(`https://wa.me/525512906449?text=${message}`, '_blank');
  };
  const openAppStore = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent)) {
      window.open('https://play.google.com/store/apps/details?id=com.igs.vitacard', '_blank');
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      window.open('https://apps.apple.com/mx/app/vitacard/id1662183933', '_blank');
    } else {
      window.open('https://play.google.com/store/apps/details?id=com.igs.vitacard', '_blank');
    }
  };
  const acquisitionModels = [{
    icon: <User className="h-10 w-10 text-vita-orange mb-4" />,
    title: 'Plan Individual',
    desc: 'Protección personal 24/7 con asistencia médica, vial y de hogar desde tu app. Actívalo en minutos.',
    cta: 'Descargar app',
    action: handleDownloadApp
  }, {
    icon: <Briefcase className="h-10 w-10 text-vita-orange mb-4" />,
    title: 'Para tu equipo',
    desc: 'Membresía integral de asistencia y seguros que eleva pertenencia, fidelidad y bienestar. Beneficio que atrae y retiene talento.',
    cta: 'Contacto empresas',
    action: handleContact
  }, {
    icon: <HeartHandshake className="h-10 w-10 text-vita-orange mb-4" />,
    title: 'Plan Familiar',
    desc: 'Cubre a toda tu familia. Da de alta a tus integrantes en la app y accede a precios preferenciales y apoyos 24/7.',
    cta: 'Adquiere tu plan familiar',
    action: handleDownloadApp
  }];
  return <>
      <Helmet>
        <title>VitaCard 365 | Asistencia Integral</title>
        <meta name="description" content="Tu membresía integral con beneficios reales y asistencia 24/7. ¡Protégete Hoy!" />
      </Helmet>
      <div className="bg-vita-blue text-white font-['Segoe_UI',_sans-serif]">
        <header className="flex justify-center items-center py-6 px-4 md:px-8 bg-transparent absolute top-0 left-0 right-0 z-50">
          <nav className="flex flex-wrap justify-center items-center space-x-4 md:space-x-6">
            <a href="#inicio" onClick={e => handleScroll(e, 'inicio')} className="text-white no-underline font-medium hover:text-vita-orange transition-colors">Inicio</a>
            <a href="#quienes-somos" onClick={e => handleScroll(e, 'quienes-somos')} className="text-white no-underline font-medium hover:text-vita-orange transition-colors">Quiénes Somos</a>
            <a href="#servicios" onClick={e => handleScroll(e, 'servicios')} className="text-white no-underline font-medium hover:text-vita-orange transition-colors">Servicios</a>
            <a href="#contacto" onClick={e => handleScroll(e, 'contacto')} className="text-white no-underline font-medium hover:text-vita-orange transition-colors">Contacto</a>
          </nav>
        </header>

        <main>
          <section id="inicio" className="relative text-center px-4 pt-40 pb-16 md:pt-48 md:pb-20 bg-cover bg-center" style={{
          backgroundImage: 'url(https://horizons-cdn.hostinger.com/968e2ff6-489b-4213-8f79-173bd439ef43/3e35e809-4268-4c76-9b31-056c484337f0.png)'
        }}>
           <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            delay: 0.2
          }} className="mb-6 md:mb-10">
              {/* Logo de Azisted removido */}
            </motion.div>
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8
          }} className="bg-white bg-opacity-10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 mx-auto max-w-lg flex flex-col items-center mt-4 md:mt-8">
              <img src="/images/Vita.png" alt="Logo VitaCard 365" className="h-56 md:h-72 w-auto mx-auto mb-6 md:mb-8 object-contain drop-shadow-xl" />
              <p className="text-lg md:text-2xl text-white mt-[-2.5rem] mb-8 max-w-md font-medium">
                Tu membresía Integral con beneficios reales y asistencia 24/7. <span className="font-bold text-vita-orange">¡Protégete Hoy!</span>
              </p>
              <Button onClick={handleDownloadApp} size="lg" className="bg-white text-vita-orange py-3 px-8 font-bold rounded-lg mb-6 hover:bg-gray-200 transition-transform hover:scale-105 text-lg">
                Descarga la app
              </Button>
              <button onClick={openAppStore} className="cursor-pointer">
                <img src="https://horizons-cdn.hostinger.com/968e2ff6-489b-4213-8f79-173bd439ef43/tiendas-E2LrH.png" alt="Botones descarga de tiendas de aplicaciones" className="h-28 md:h-44 mx-auto" />
              </button>
            </motion.div>
          </section>

          <section id="quienes-somos" className="py-20 md:py-24 px-4 bg-vita-blue">
            <motion.div initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true,
            amount: 0.3
          }} transition={{
            duration: 0.8
          }} className="bg-white bg-opacity-10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-10 mx-auto max-w-4xl flex flex-col items-center text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">¿Quiénes somos?</h2>
              <img src="/images/Azisted.png" alt="Azisted Logo" className="h-16 md:h-24 w-auto mx-auto mb-4 object-contain" />
              <p className="text-base md:text-xl text-white/90 leading-relaxed">
                Creamos soluciones de asistencia que te cuidan 24/7.
                En alianza con <span className="font-bold">IGS</span>, líder de asistencias en LATAM, llevamos VitaCard 365 a personas y empresas con una mezcla de tecnología, IA y atención humana. Nuestro objetivo es simple: resolver imprevistos con velocidad, calidez y alcance global.
              </p>
            </motion.div>
          </section>

          <section className="py-12 md:py-16 px-4 bg-vita-blue">
            <div className="max-w-md mx-auto">
              <motion.div className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-4 md:p-6 border border-white/10 flex flex-col items-center" initial={{
                opacity: 0,
                y: 30
              }} whileInView={{
                opacity: 1,
                y: 0
              }} viewport={{
                once: true,
                amount: 0.3
              }} transition={{
                duration: 0.7
              }}>
                <h3 className="text-3xl md:text-4xl font-bold text-white text-center mt-4 mb-4">Algunas de tus coberturas</h3>
                <img src="https://horizons-cdn.hostinger.com/968e2ff6-489b-4213-8f79-173bd439ef43/66f4c3ab4cc29cfe5839de8abb7f02ae.png" alt="Banner de beneficios de VitaCard" className="w-full max-w-md rounded-xl mx-auto" />
              </motion.div>
            </div>
          </section>

          <section id="servicios" className="py-20 md:py-24 px-4 bg-soft-gradient">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-center text-vita-orange text-4xl md:text-5xl font-bold mb-12 md:mb-16">Elige tu plan ideal</h2>
              <div className="flex flex-wrap gap-8 justify-center">
                {acquisitionModels.map((card, index) => <motion.div key={index} initial={{
                opacity: 0,
                scale: 0.9
              }} whileInView={{
                opacity: 1,
                scale: 1
              }} viewport={{
                once: true,
                amount: 0.5
              }} transition={{
                duration: 0.5,
                delay: index * 0.15
              }} className="bg-white/5 text-white rounded-2xl p-8 max-w-sm flex-1 flex flex-col shadow-2xl backdrop-blur-lg border border-white/10 transition-transform hover:scale-105 min-w-[280px]">
                    <div className="flex-grow">
                      {card.icon}
                      <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
                      <p className="text-white/80 mb-6">{card.desc}</p>
                    </div>
                    <Button onClick={card.action} variant="outline" className="mt-auto bg-transparent border-vita-orange text-vita-orange hover:bg-vita-orange hover:text-white w-full">
                      {card.cta}
                    </Button>
                  </motion.div>)}
              </div>
            </div>
          </section>

          <section id="imagen-final" className="py-12 px-4 bg-vita-blue">
            <div className="max-w-6xl mx-auto flex flex-row gap-6 justify-center items-stretch">
              {[1,2,3].map(i => (
                <motion.div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-2 flex flex-col items-center justify-center w-10/12 sm:w-72 md:w-[22rem] lg:w-[28rem] overflow-hidden" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.8 }}>
                  <img src={`/images/Gente${i}.png`} alt={`Gente ${i}`} className="w-full h-44 sm:h-72 md:h-80 lg:h-[28rem] rounded-xl object-cover" />
                </motion.div>
              ))}
            </div>
          </section>

          <section id="contacto" className="py-20 px-4 max-w-5xl mx-auto text-center bg-soft-gradient rounded-t-3xl">
            <h2 className="text-vita-orange text-3xl md:text-4xl font-bold mb-4">Contacto</h2>
            <p className="text-base md:text-lg">contacto@vitacard365.com <br/>+52 55 1234 5678</p>
          </section>
        </main>

        <footer className="bg-cover text-white py-10 px-4 text-center text-sm" style={{
        backgroundImage: "url('https://horizons-cdn.hostinger.com/968e2ff6-489b-4213-8f79-173bd439ef43/Footer.png')"
      }}>
          <p>© 2025 VitaCard 365 by Azisted. Todos los derechos reservados. Tu salud, nuestra prioridad.</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mt-2">
            <a href="/politicas-de-privacidad" className="hover:text-vita-orange transition-colors">Políticas de Privacidad</a>
            <span className="hidden sm:inline">|</span>
            <a href="/terminos-y-condiciones" className="hover:text-vita-orange transition-colors">Términos y Condiciones</a>
          </div>
          <p className="mt-4">Desarrollo Azisted Systems.</p>
        </footer>
      </div>
    </>;
};
export default Landing;