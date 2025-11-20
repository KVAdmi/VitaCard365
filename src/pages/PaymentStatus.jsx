import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

// Loader animado VitaCard
function NeonLoader() {
  return (
    <div className="flex justify-center items-center my-8">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 drop-shadow-[0_0_12px_rgba(0,255,255,0.6)]" style={{ borderLeftColor: '#e91e63', borderRightColor: '#1de9b6', borderTopColor: '#00eaff', borderBottomColor: '#00eaff' }}></div>
    </div>
  );
}

// Iconos neon
function NeonCheck() {
  return <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-4 drop-shadow-[0_0_12px_rgba(0,255,255,0.6)]"><circle cx="24" cy="24" r="22" stroke="#00eaff" strokeWidth="4" fill="#0c1c3e" /><path d="M16 24l6 6 10-12" stroke="#00eaff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function NeonCancel() {
  return <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-4 drop-shadow-[0_0_12px_rgba(233,30,99,0.6)]"><circle cx="24" cy="24" r="22" stroke="#e91e63" strokeWidth="4" fill="#0c1c3e" /><path d="M17 17l14 14M31 17l-14 14" stroke="#e91e63" strokeWidth="4" strokeLinecap="round"/></svg>;
}
function NeonFamily() {
  return <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-4 drop-shadow-[0_0_12px_rgba(29,233,182,0.6)]"><circle cx="24" cy="24" r="22" stroke="#1de9b6" strokeWidth="4" fill="#0c1c3e" /><path d="M18 28c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="#1de9b6" strokeWidth="3" strokeLinecap="round"/><path d="M24 18a4 4 0 110 8 4 4 0 010-8z" stroke="#1de9b6" strokeWidth="3"/></svg>;
}

const BG = 'bg-[#0c1c3e] min-h-screen flex flex-col items-center justify-center px-4';
const CARD = 'rounded-2xl bg-white/5 border border-white/10 p-8 max-w-md mx-auto shadow-xl backdrop-blur-md';
const TITLE = 'text-2xl font-bold text-white mb-2 text-center';
const SUB = 'text-white/80 text-center mb-6';
const BTN = 'mt-6 w-full py-3 rounded-lg font-semibold text-lg bg-[#00eaff] hover:bg-[#1de9b6] text-[#0c1c3e] shadow-lg transition drop-shadow-[0_0_12px_rgba(0,255,255,0.6)]';
const BTN2 = 'mt-3 w-full py-3 rounded-lg font-semibold text-lg bg-white/10 hover:bg-white/20 text-white shadow-lg transition';

export default function PaymentStatus() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending'); // pending, active, paid, cancelled, family, no-session
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let timeout;
    async function fetchStatus() {
      setLoading(true);
      // 1. Leer sesión
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      if (!data?.user) {
        // Reintentar una vez más tras 1s
        timeout = setTimeout(async () => {
          const { data: data2 } = await supabase.auth.getUser();
          setUser(data2?.user || null);
          if (!data2?.user) {
            setStatus('no-session');
            setLoading(false);
            return;
          }
          await fetchPlan(data2.user.id);
        }, 1000);
        return;
      }
      await fetchPlan(data.user.id);
    }
    async function fetchPlan(uid) {
      // 2. Consultar estado del plan (Supabase)
      try {
        const { data, error } = await supabase
          .from('profiles_certificado_v2')
          .select('acceso_activo, membresia, periodicidad, estado_pago, codigo_vita, family_id')
          .eq('user_id', uid)
          .maybeSingle();
        setPlan(data || null);
        // Lógica de estados
        if (!data) {
          setStatus('cancelled');
        } else if (data.acceso_activo && ['vitalicio','corporativo','kv','empresarial'].includes((data.membresia||'').toLowerCase())) {
          setStatus('active'); // Caso A
        } else if (data.acceso_activo && (data.membresia||'').toLowerCase()==='familiar' && data.family_id) {
          setStatus('family'); // Caso D
        } else if (data.acceso_activo && (data.estado_pago||'').toLowerCase()==='pagado') {
          setStatus('paid'); // Caso B
        } else {
          setStatus('cancelled'); // Caso C
        }
      } catch {
        setStatus('cancelled');
      }
      setLoading(false);
    }
    fetchStatus();
    return () => clearTimeout(timeout);
  }, []);

  // UI
  return (
    <div className={BG}>
      <div className={CARD}>
        {loading ? (
          <>
            <NeonLoader />
            <div className={TITLE}>Estamos consultando tu pago…</div>
            <div className={SUB}>Por favor espera unos segundos mientras validamos el estado de tu operación.</div>
          </>
        ) : status === 'active' ? (
          <>
            <NeonCheck />
            <div className={TITLE}>Tu cobertura principal sigue activa</div>
            <div className={SUB}>No registramos ningún pago en este intento.</div>
            <button className={BTN} onClick={()=>navigate('/perfil')}>Ir a mi perfil</button>
          </>
        ) : status === 'paid' ? (
          <>
            <NeonCheck />
            <div className={TITLE}>¡Tu pago fue confirmado!</div>
            <div className={SUB}>Tu póliza está activa. Puedes consultar tus coberturas.</div>
            <button className={BTN} onClick={()=>navigate('/coberturas')}>Ver mis coberturas</button>
          </>
        ) : status === 'cancelled' ? (
          <>
            <NeonCancel />
            <div className={TITLE}>No se completó tu operación</div>
            <div className={SUB}>Tu plan aún no está activo. Puedes volver a intentar el pago o explorar la app.</div>
            <button className={BTN} onClick={()=>navigate('/mi-plan')}>Volver a mi plan</button>
            <button className={BTN2} onClick={()=>navigate('/dashboard')}>Explorar la app</button>
          </>
        ) : status === 'family' ? (
          <>
            <NeonFamily />
            <div className={TITLE}>¡Listo! Membresías familiares activadas</div>
            <div className={SUB}>Tus nuevas membresías familiares han sido activadas correctamente.</div>
            <button className={BTN} onClick={()=>navigate('/perfil')}>Gestionar mi familia</button>
          </>
        ) : status === 'no-session' ? (
          <>
            <NeonCancel />
            <div className={TITLE}>Tu operación está registrada</div>
            <div className={SUB}>Para ver tus coberturas vuelve a iniciar sesión.</div>
            <button className={BTN} onClick={()=>navigate('/login')}>Iniciar sesión</button>
          </>
        ) : null}
      </div>
    </div>
  );
}
