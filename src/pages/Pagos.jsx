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
  const [downloading, setDownloading] = useState(false);

  // Descarga el PDF desde Supabase Storage y lo guarda nativamente en Android/iOS o como descarga web
  const handleDescargarPoliza = async () => {
    setDownloading(true);
    try {
      const filePath = 'certificado_vitacard365.pdf';
      const clienteNombre = user?.user_metadata?.name || 'Cliente';
      // Consultar el folio real desde la tabla profiles (campo codigo_vita)
      let folioVita = 'SIN_FOLIO';
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('codigo_vita')
          .eq('user_id', user.id)
          .maybeSingle();
        if (profile && profile.codigo_vita) {
          folioVita = profile.codigo_vita.replace(/\s+/g, '_');
        }
      }
      const { data, error } = await supabase.storage.from('certificados').createSignedUrl(filePath, 60);
      if (error || !data?.signedUrl) {
        console.error('[Pagos] createSignedUrl error:', error, data);
        throw new Error(error?.message || 'No se pudo obtener el certificado.');
      }
      const response = await fetch(data.signedUrl);
      if (!response.ok) {
        const text = await response.text().catch(() => 'no-body');
        console.error('[Pagos] fetch signedUrl failed', response.status, response.statusText, text);
        throw new Error(`No se pudo descargar el certificado. (${response.status})`);
      }
      const blob = await response.blob();
      const nombreArchivo = `Poliza_VitaCard365_${folioVita}_${clienteNombre.replace(/\s+/g,'_')}.pdf`;

      // Detectar plataforma
      const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
      if (isCapacitor) {
        // Importar Filesystem dinámicamente para evitar errores en web
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        // Leer blob como base64
        const toBase64 = (blob) => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const base64 = await toBase64(blob);
        // Intentar guardar en un par de directorios conocidos (diagnóstico y fallback)
        const platform = window.Capacitor.getPlatform?.() || 'unknown';
        const tryDirs = [Directory.Documents, Directory.External, Directory.Data];
        let saved = false;
        let lastError = null;
        for (const d of tryDirs) {
          try {
            await Filesystem.writeFile({
              path: nombreArchivo,
              data: base64,
              directory: d,
              encoding: Encoding.BASE64,
            });
            console.log('[Pagos] Archivo escrito en directorio:', d, 'plataforma:', platform);
            alert('Póliza guardada en tus documentos. Puedes abrirla desde tu gestor de archivos.');
            saved = true;
            break;
          } catch (err) {
            console.error('[Pagos] writeFile failed for directory', d, err);
            lastError = err;
          }
        }
        if (!saved) {
          // Fallback: intentar abrir el signedUrl en el navegador del sistema (Browser plugin)
          try {
            console.warn('[Pagos] No se pudo escribir el archivo en FS, se abrirá el enlace en el navegador externo como fallback.', lastError);
            const { Browser } = await import('@capacitor/browser');
            await Browser.open({ url: data.signedUrl });
            alert('No se pudo guardar automáticamente la póliza en la app. Se abrió el enlace en el navegador para que puedas descargarla.');
          } catch (err2) {
            console.error('[Pagos] Fallback Browser.open failed:', err2);
            // Último recurso: intentar descarga por ventana (puede abrir external browser)
            try {
              const url = data.signedUrl;
              window.open(url, '_blank');
              alert('Intenté abrir el enlace en el navegador. Si la descarga no inicia, intenta desde la versión web.');
            } catch (err3) {
              console.error('[Pagos] ultimate fallback failed:', err3);
              throw lastError || err3;
            }
          }
        }
      } else {
        // Web: descarga normal
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 200);
      }
    } catch (e) {
      console.error('[Pagos] descargar poliza failed:', e);
      alert(`No se pudo descargar la póliza. ${e?.message || 'Intenta más tarde.'}`);
    } finally {
      setDownloading(false);
    }
  };
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
  const [notifyLoading, setNotifyLoading] = useState(false);

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
    try{
      // Intentamos asegurar permiso de notificaciones para programar la alarma, pero
      // incluso si el usuario lo niega, crearemos el evento en la agenda para que
      // el toggle quede reflejado en la cuenta.
      try { await asegurarPermisoNotificaciones(); } catch (e) { /* noop - seguimos creando el evento */ }
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
      setNotifyLoading(true);
      if (!nextPaymentISO || nextPaymentDate === 'N/A') { setNotifyChecked(false); setNotifyEventId(null); setNotifyLoading(false); return; }
      // Calcula la fecha previa (un día antes) y busca evento existente del usuario
      const [y,m,d] = nextPaymentISO.split('-').map(Number);
      const due = new Date(y, (m-1), d, 9, 0, 0, 0);
      const pre = new Date(due); pre.setDate(pre.getDate()-1);
      const preISO = `${pre.getFullYear()}-${String(pre.getMonth()+1).padStart(2,'0')}-${String(pre.getDate()).padStart(2,'0')}`;
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id; if (!uid) { setNotifyChecked(false); setNotifyEventId(null); setNotifyLoading(false); return; }
      const { data } = await supabase
        .from('agenda_events')
        .select('id')
        .eq('user_id', uid)
        .eq('title', 'Recordatorio de pago')
        .eq('event_date', preISO)
        .maybeSingle();
      if (data?.id) { setNotifyChecked(true); setNotifyEventId(data.id); } else { setNotifyChecked(false); setNotifyEventId(null); }
      setNotifyLoading(false);
    } catch { setNotifyLoading(false); }
  })(); }, [nextPaymentISO, nextPaymentDate]);

  async function onToggleNotify(checked){
    setNotifyLoading(true);
    if (checked) {
      setNotifyChecked(true);
      try {
        const ev = await handleLocalReminder();
        if (ev && ev.id) setNotifyEventId(ev.id);
        else setNotifyEventId(null);
      } catch (err) {
        console.error('[Pagos] onToggleNotify: create reminder failed', err);
        setNotifyEventId(null);
      }
    } else {
      try {
        if (notifyEventId) await deleteAgendaEvent(notifyEventId);
      } catch (err) { console.error('[Pagos] onToggleNotify: delete reminder failed', err); }
      setNotifyChecked(false);
      setNotifyEventId(null);
    }
    setNotifyLoading(false);
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
              <div className="flex w-full justify-center mt-4">
                <button
                  onClick={handleDescargarPoliza}
                  disabled={downloading}
                  className="px-6 py-3 rounded-xl text-white font-bold shadow-lg backdrop-blur-md border border-orange-200/30 hover:scale-105 active:scale-95 transition-all text-base"
                  style={{
                    background: 'linear-gradient(135deg, #FF7A00 80%, #FFB347 100%)',
                    boxShadow: '0 4px 24px 0 #FF7A0033'
                  }}
                >
                  {downloading ? 'Descargando...' : 'Descargar mi póliza VC 365'}
                </button>
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
              <input type="checkbox" className="accent-orange-500 h-5 w-5" checked={!!notifyChecked} disabled={notifyLoading} onChange={async e => { await onToggleNotify(e.target.checked); }} />
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