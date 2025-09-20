import React, { useEffect, useState } from 'react';
import { Smile, ClipboardList, Clock, Headphones } from 'lucide-react';

const START_DATE = new Date('2009-03-08T00:00:00');
const USERS_FINAL = 450000;
const SERVICES_FINAL = 112000;
const CLIENTS_FINAL = 99;

function getServiceTime() {
  const now = new Date();
  let diff = now - START_DATE;
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  const lastAnniversary = new Date(START_DATE.getFullYear() + years, START_DATE.getMonth(), START_DATE.getDate(), 0, 0, 0);
  let sinceAnniv = now - lastAnniversary;
  if (sinceAnniv < 0) {
    // Si el aniversario aún no ha llegado este año
    const prevAnniv = new Date(lastAnniversary.getFullYear() - 1, lastAnniversary.getMonth(), lastAnniversary.getDate(), 0, 0, 0);
    sinceAnniv = now - prevAnniv;
  }
  const days = Math.floor(sinceAnniv / (1000 * 60 * 60 * 24));
  const hours = Math.floor((sinceAnniv % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((sinceAnniv % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((sinceAnniv % (1000 * 60)) / 1000);
  return { years, days, hours, minutes, seconds };
}

function useAnimatedCount(finalValue, duration = 3500, startValue = 0) {
  const [value, setValue] = useState(startValue);
  useEffect(() => {
    let start = null;
    let raf;
    function animate(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(startValue + (finalValue - startValue) * progress));
      if (progress < 1) raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [finalValue, duration, startValue]);
  return value;
}

const AnimatedStats = () => {
  const users = useAnimatedCount(USERS_FINAL, 3500, 420000);
  const services = useAnimatedCount(SERVICES_FINAL, 3500, 100000);
  const clients = useAnimatedCount(CLIENTS_FINAL, 2500, 95);
  const animatedYears = useAnimatedCount(getServiceTime().years, 2000, 0);
  const animatedClients = useAnimatedCount(CLIENTS_FINAL, 2500, 95);
  const [serviceTime, setServiceTime] = useState(getServiceTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setServiceTime(getServiceTime());
    }, 1000); // update every second for live clock
    return () => clearInterval(interval);
  }, []);

  return (
  <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mt-2">
      {/* Usuarios protegidos */}
  <div className="rounded-2xl glass-card text-white p-4 sm:p-8 flex flex-col items-center shadow-xl relative min-h-[110px] sm:min-h-[180px] backdrop-blur-md bg-white/10 border border-white/10" style={{background:'rgba(24,28,40,0.30)'}}>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-vita-blue-dark rounded-full p-4 shadow-lg border-4 border-white">
          <Smile className="h-10 w-10 text-white" />
        </div>
        <div className="mt-10 text-4xl font-extrabold tracking-tight">+{users.toLocaleString()}</div>
        <div className="text-lg mt-2 font-medium">Usuarios protegidos</div>
      </div>
      {/* Solicitudes atendidas */}
  <div className="rounded-2xl glass-card text-white p-4 sm:p-8 flex flex-col items-center shadow-xl relative min-h-[110px] sm:min-h-[180px] backdrop-blur-md bg-white/10 border border-white/10" style={{background:'rgba(24,28,40,0.30)'}}>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-vita-orange rounded-full p-4 shadow-lg border-4 border-white">
          <ClipboardList className="h-10 w-10 text-white" />
        </div>
        <div className="mt-10 text-4xl font-extrabold tracking-tight">+{services.toLocaleString()}</div>
        <div className="text-lg mt-2 font-medium">Solicitudes atendidas</div>
      </div>
      {/* Años de servicio continuo (animado, reloj digital) */}
  <div className="rounded-2xl glass-card text-white p-4 sm:p-8 flex flex-col items-center shadow-xl relative min-h-[110px] sm:min-h-[180px] backdrop-blur-md bg-white/10 border border-white/10" style={{background:'rgba(24,28,40,0.30)'}}>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-vita-orange rounded-full p-4 shadow-lg border-4 border-white">
          <Clock className="h-10 w-10 text-white" />
        </div>
        <div className="mt-10 text-3xl font-extrabold tracking-tight text-center">
          +{animatedYears} Años
        </div>
        <div className="text-base font-semibold text-center mt-1">
          Día <span className="font-mono">{serviceTime.days}</span>
        </div>
        <div className="text-xl font-mono font-bold text-center mt-1" style={{letterSpacing:'1px'}}>
          {serviceTime.hours.toString().padStart(2, '0')}
          :{serviceTime.minutes.toString().padStart(2, '0')}
          :{serviceTime.seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-lg mt-2 font-medium">Años de servicio continuo</div>
      </div>
      {/* Clientes satisfechos (animado) */}
  <div className="rounded-2xl glass-card text-white p-4 sm:p-8 flex flex-col items-center shadow-xl relative min-h-[110px] sm:min-h-[180px] backdrop-blur-md bg-white/10 border border-white/10" style={{background:'rgba(24,28,40,0.30)'}}>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-vita-blue-dark rounded-full p-4 shadow-lg border-4 border-white">
          <Headphones className="h-10 w-10 text-white" />
        </div>
        <div className="mt-10 text-4xl font-extrabold tracking-tight">{animatedClients}%</div>
        <div className="text-lg mt-2 font-medium">Clientes satisfechos</div>
      </div>
    </div>
  );
};

export default AnimatedStats;
