import React, { useRef, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import VitaCard365Logo from '../components/Vita365Logo';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { fetchAccess, getCurrentUid } from '@/lib/access';
import { ShieldCheck, ArrowRight, User, Users, CalendarDays, ShieldQuestion } from 'lucide-react';
import { asegurarPermisoNotificaciones } from '@/lib/notifications';
import { createAgendaEvent, deleteAgendaEvent } from '@/lib/agenda';

const API_BASE = (import.meta.env.VITE_API_BASE ?? "https://api.vitacard365.com").replace(/\/+$/, "");

const Pagos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [planType, setPlanType] = React.useState('individual');
  const [nextPaymentDate, setNextPaymentDate] = React.useState('N/A');
  // Guardamos también una fecha ISO local (YYYY-MM-DD) para cálculos confiables
  const [nextPaymentISO, setNextPaymentISO] = React.useState(null);
  const [planStatus, setPlanStatus] = React.useState('Pendiente');
  const [familyMembers, setFamilyMembers] = React.useState([]);
  // Estado controlado del toggle de notificación y el id del evento en agenda
  const [notifyChecked, setNotifyChecked] = useState(false);
  const [notifyEventId, setNotifyEventId] = useState(null);

  React.useEffect(()=>{ (async()=>{
    // Acceso/membresía real
    const access = await fetchAccess();
    if (access) {
      const ep = (access.estado_pago || '').toLowerCase();
      if (ep === 'cancelado') setPlanStatus('Cancelado');
      else if (ep === 'vencido') setPlanStatus('Suspendido');
      else setPlanStatus(access.acceso_activo ? 'Activo' : 'Pendiente');
      setPlanType(access.membresia || 'individual');
    }
    // Próximo pago desde member_billing (si no es vitalicio)
    const uid = await getCurrentUid();
    if (uid) {
      if ((access?.periodicidad || '').toLowerCase() === 'vitalicio') {
        setNextPaymentDate('N/A');
      } else {
        const { data } = await supabase
          .from('member_billing')
          .select('pagado_desde,pagado_hasta,periodicidad,created_at')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) {
          const per = (data.periodicidad || '').toLowerCase();
          if (per === 'vitalicio') {
            setNextPaymentDate('N/A');
            setNextPaymentISO(null);
          } else if (data.pagado_hasta) {
            const due = new Date(data.pagado_hasta);
            setNextPaymentDate(due.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric'}));
            // ISO local (no UTC): YYYY-MM-DD
            const y = due.getFullYear();
            const m = String(due.getMonth()+1).padStart(2,'0');
            const d = String(due.getDate()).padStart(2,'0');
            setNextPaymentISO(`${y}-${m}-${d}`);
          } else {
            // Calcular desde pagado_desde o created_at según periodicidad
            const base = data.pagado_desde ? new Date(data.pagado_desde) : new Date(data.created_at);
            const addMonths = (d, m) => { const nd = new Date(d); nd.setMonth(nd.getMonth() + m); return nd; };
            const monthsMap = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 };
            const months = monthsMap[per] || 1;
            const due = addMonths(base, months);
            setNextPaymentDate(due.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric'}));
            const y = due.getFullYear();
            const m = String(due.getMonth()+1).padStart(2,'0');
            const d = String(due.getDate()).padStart(2,'0');
            setNextPaymentISO(`${y}-${m}-${d}`);
          }
        }
      }
    }
  })(); }, []);
  
  if (!user) {
    return <Layout title="Cargando..."><div className="p-6 text-center">Cargando datos de usuario...</div></Layout>;
  }

  const { name } = user.user_metadata || {};

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

  // Referencia eliminada: checkbox ahora es controlado por estado

  // Función para registrar el subscription push y llamar al backend
  async function handleLocalReminder() {
    // Programa una notificación local un día antes del próximo pago (si hay fecha)
    if (!nextPaymentISO || nextPaymentDate === 'N/A') return;
    const ok = await asegurarPermisoNotificaciones();
    if (!ok) return;
    try{
      // Construimos la fecha local a partir de la ISO almacenada y restamos 1 día
      const [y,m,d] = nextPaymentISO.split('-').map(Number);
      const due = new Date(y, (m-1), d, 9, 0, 0, 0); // 09:00 del día de vencimiento
      const pre = new Date(due);
      pre.setDate(pre.getDate() - 1); // un día antes
      // Evento en agenda personal
      const ev = await createAgendaEvent({
        type: 'otro',
        title: 'Recordatorio de pago',
        description: 'Tu plan está por vencer. ¡Mantén tu cobertura activa!',
        event_date: `${pre.getFullYear()}-${String(pre.getMonth()+1).padStart(2,'0')}-${String(pre.getDate()).padStart(2,'0')}`,
        event_time: '09:00:00',
        notify: true,
        repeat_type: 'none',
        repeat_until: null,
      });
      // Marca UI como activo y guarda id para permitir desactivar después
      setNotifyChecked(true);
      setNotifyEventId(ev?.id || null);
      return ev;
    }catch{}
  }

  // Sincroniza el estado del toggle leyendo de Supabase si ya existe el evento
  useEffect(()=>{ (async ()=>{
    try {
      if (!nextPaymentISO || nextPaymentDate === 'N/A') { setNotifyChecked(false); setNotifyEventId(null); return; }
      // Calcula la fecha previa (un día antes) y busca evento existente del usuario
      const [y,m,d] = nextPaymentISO.split('-').map(Number);
      const due = new Date(y, (m-1), d, 9, 0, 0, 0);
      const pre = new Date(due); pre.setDate(pre.getDate()-1);
      const preISO = `${pre.getFullYear()}-${String(pre.getMonth()+1).padStart(2,'0')}-${String(pre.getDate()).padStart(2,'0')}`;
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id; if (!uid) { setNotifyChecked(false); setNotifyEventId(null); return; }
      const { data } = await supabase
        .from('agenda_events')
        .select('id')
        .eq('user_id', uid)
        .eq('title', 'Recordatorio de pago')
        .eq('event_date', preISO)
        .maybeSingle();
      if (data?.id) { setNotifyChecked(true); setNotifyEventId(data.id); } else { setNotifyChecked(false); setNotifyEventId(null); }
    } catch { /* noop */ }
  })(); }, [nextPaymentISO, nextPaymentDate]);

  async function onToggleNotify(checked){
    if (checked) {
      await handleLocalReminder();
    } else {
      try {
        if (notifyEventId) await deleteAgendaEvent(notifyEventId);
      } catch { /* noop */ }
      setNotifyChecked(false);
      setNotifyEventId(null);
    }
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
              <input type="checkbox" className="accent-orange-500 h-5 w-5" checked={!!notifyChecked} onChange={async e => { await onToggleNotify(e.target.checked); }} />
              <span className="text-white text-sm">Notificarme antes del vencimiento de mi plan</span>
            </label>
            <p className="text-xs text-white/60 mt-2">
              Activa esta opción para recibir un aviso antes de que expire tu plan y no perder la cobertura.
              {(!nextPaymentISO || nextPaymentDate === 'N/A') && (
                <span className="block mt-1 text-[11px] text-white/50">Disponible cuando haya una fecha de próximo pago.</span>
              )}
            </p>
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