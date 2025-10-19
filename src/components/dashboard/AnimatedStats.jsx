import React, { useEffect, useState } from 'react';
import { Smile, ClipboardList, Clock, Headphones } from 'lucide-react';

const START_DATE = new Date('2009-03-08T00:00:00');
const USERS_FINAL = 450000;
const SERVICES_FINAL = 112000;
const CLIENTS_FINAL = 99;

function getServiceTime() {
  const now = new Date();
  const diff = now - START_DATE;
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  const lastAnniversary = new Date(
    START_DATE.getFullYear() + years,
    START_DATE.getMonth(),
    START_DATE.getDate(), 0, 0, 0
  );
  let sinceAnniv = now - lastAnniversary;
  if (sinceAnniv < 0) {
    const prevAnniv = new Date(
      lastAnniversary.getFullYear() - 1,
      lastAnniversary.getMonth(),
      lastAnniversary.getDate(), 0, 0, 0
    );
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
      if (start === null) start = ts;
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
  const clients = useAnimatedCount(CLIENTS_FINAL, 4000, 80); // más lento
  const animatedYears = useAnimatedCount(getServiceTime().years, 3500, 0); // más lento
  const [serviceTime, setServiceTime] = useState(getServiceTime());

  useEffect(() => {
    const interval = setInterval(() => setServiceTime(getServiceTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Tamaño unificado de tarjeta (entran 2 por fila con gap-12)
  const CARD =
    "rounded-2xl glass-card text-white pt-12 pb-4 px-4 sm:pt-16 sm:pb-8 sm:px-8 flex flex-col items-center justify-center " +
    "shadow-xl relative backdrop-blur-md bg-white/10 border border-white/10 overflow-hidden " +
    "w-[180px] h-[140px] sm:w-[220px] sm:h-[170px]";

  return (
  <div
    className="
      grid grid-cols-2
      gap-x-8 gap-y-8
      sm:gap-x-10 sm:gap-y-12
      w-[392px] sm:w-[480px]    /* ancho exacto: 2 cards + gap */
      mx-auto mt-8 p-2 sm:p-6
      justify-items-center items-center
    "
  >
      {/* Usuarios protegidos */}
      <div className={CARD} style={{ background: 'rgba(24,28,40,0.30)' }}>
  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-vita-blue-dark rounded-full p-2 shadow-lg border-2 border-white z-20">
          <Smile className="h-7 w-7 text-white" />
        </div>
        <div className="mt-8 text-lg font-extrabold tracking-tight text-center">+{users.toLocaleString()}</div>
        <div className="text-xs mt-1 font-medium text-center">Usuarios protegidos</div>
      </div>

      {/* Solicitudes atendidas */}
      <div className={CARD} style={{ background: 'rgba(24,28,40,0.30)' }}>
  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-vita-orange rounded-full p-2 shadow-lg border-2 border-white z-20">
          <ClipboardList className="h-7 w-7 text-white" />
        </div>
        <div className="mt-8 text-lg font-extrabold tracking-tight text-center">+{services.toLocaleString()}</div>
        <div className="text-xs mt-1 font-medium text-center">Solicitudes atendidas</div>
      </div>

      {/* Años de servicio       */}
      <div className={CARD} style={{ background: 'rgba(24,28,40,0.30)' }}>
  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-vita-orange rounded-full p-2 shadow-lg border-2 border-white z-20">
          <Clock className="h-7 w-7 text-white" />
        </div>
        <div className="mt-8 text-lg font-extrabold tracking-tight text-center">+{animatedYears} Años</div>
        <div className="text-sm font-mono font-bold text-center mt-2" style={{ letterSpacing: '1px' }}>
          {serviceTime.hours.toString().padStart(2, '0')}
          :{serviceTime.minutes.toString().padStart(2, '0')}
          :{serviceTime.seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-xs mt-1 font-medium text-center">Años de servicio      </div>
      </div>

      {/* Clientes satisfechos */}
      <div className={CARD} style={{ background: 'rgba(24,28,40,0.30)' }}>
  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-vita-blue-dark rounded-full p-2 shadow-lg border-2 border-white z-20">
          <Headphones className="h-7 w-7 text-white" />
        </div>
        <div className="mt-8 text-lg font-extrabold tracking-tight text-center">{clients}%</div>
        <div className="text-xs mt-1 font-medium text-center">Clientes satisfechos</div>
      </div>
    </div>
  );
};

export default AnimatedStats;
