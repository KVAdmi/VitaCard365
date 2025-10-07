
import React, { useEffect, useState } from 'react';
import { askIVita } from '@/api/evitaApi';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Calendar, 
  CreditCard, 
  User,
  ArrowLeft,
  Bell
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';

// Ícono de robot elegante SVG
const RobotIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="4" y="7" width="16" height="10" rx="5" fill="#fff" fillOpacity="0.12" stroke="#FFB300" strokeWidth="1.5"/>
    <circle cx="8.5" cy="12" r="1.5" fill="#FFB300"/>
    <circle cx="15.5" cy="12" r="1.5" fill="#FFB300"/>
    <rect x="10.5" y="15" width="3" height="1" rx="0.5" fill="#FFB300"/>
    <rect x="11.25" y="4" width="1.5" height="3" rx="0.75" fill="#fff" stroke="#FFB300" strokeWidth="1"/>
    <rect x="3" y="10" width="2" height="4" rx="1" fill="#fff" stroke="#FFB300" strokeWidth="1"/>
    <rect x="19" y="10" width="2" height="4" rx="1" fill="#fff" stroke="#FFB300" strokeWidth="1"/>
  </svg>
);
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { getAvatarUrl } from '@/lib/avatar';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

// Feed simple (agenda + pago) – se genera al vuelo en cliente
function useNotificationsFeed(){
  const [items, setItems] = React.useState([]);
  React.useEffect(()=>{
    (async()=>{
      try{
        const { fetchUpcomingAgenda } = await import('@/lib/agenda');
        const agenda = await fetchUpcomingAgenda(7);
        const list = agenda.slice(0,5).map(ev=>({
          title: ev.type === 'medicamento' ? 'Medicamento' : ev.type === 'cita_medica' ? 'Cita médica' : 'Recordatorio',
          description: ev.title,
          time: new Date(ev.event_date+'T'+ev.event_time).toLocaleString(),
        }));
        // Placeholder: recordatorio de pago si falta <=7 días (se puede enriquecer con member_billing)
        // Mantengo minimal para no bloquear el flujo
        setItems(list);
      }catch{
        setItems([]);
      }
    })();
  },[]);
  return items;
}

const Layout = ({ children, title, showBackButton = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
    const { user } = useAuth();
    const userAlias = user?.alias || user?.name || "Tú";
  const [hasNotifications, setHasNotifications] = useState(true);
  const notifications = useNotificationsFeed();
  const [showChat, setShowChat] = useState(false);
  // Chat i-Vita
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { from: "bot", text: "¡Hola! Soy i-Vita, tu asistente médico. ¿En qué puedo ayudarte hoy?" }
  ]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState("");
  const examplePrompts = [];

  const navigationItems = [
    { path: '/dashboard', icon: Home, label: 'Inicio' },
    { path: '/agenda', icon: Calendar, label: 'Agenda' },
    { path: '/mi-plan', icon: CreditCard, label: 'Mi Plan' },
    { path: '/perfil', icon: User, label: 'Perfil' },
  { path: '/i-vita', icon: RobotIcon, label: 'i-Vita', isChat: true }
  ];

  // Fallback: mostrar botón flotante de regreso si no se pidió explícitamente
  const topLevel = ['/dashboard','/fit','/home','/','/agenda','/bienestar','/mi-plan','/perfil'];
  const showFloatingBack = !showBackButton && !topLevel.includes(location.pathname);

  // Manejar botón físico de Android para navegar atrás dentro de la app (solo nativo)
  useEffect(() => {
    let sub;
    (async () => {
      if (!Capacitor.isNativePlatform()) return;
      const { App } = await import('@capacitor/app');
      sub = App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) navigate(-1);
        else if (App.minimize) App.minimize();
      });
    })();
    return () => { try { sub && sub.remove(); } catch {} };
  }, [navigate]);

  // Cerrar overlays/modales globales al cambiar de ruta para evitar "pantalla oscura"
  useEffect(() => {
    // Cierra el chat si estuviera abierto
    if (showChat) setShowChat(false);
    // Intenta cerrar cualquier Dialog/Sheet compatible con tecla Escape
    try {
      const evt = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true,
      });
      document.dispatchEvent(evt);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Avatar firmado y refresco para evitar expiración
  const [signedAvatar, setSignedAvatar] = useState(null);
  useEffect(() => {
    let timer;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const uid = u?.user?.id;
        if (!uid) { setSignedAvatar(null); return; }
        // Primero intentamos en profiles_certificado_v2 (prod)
        const { data: cert } = await supabase
          .from('profiles_certificado_v2')
          .select('avatar_url')
          .eq('user_id', uid)
          .limit(1)
          .single();
        let path = cert?.avatar_url;
        if (!path) {
          // Fallback a profiles.normal
          const { data: prof } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('user_id', uid)
            .limit(1)
            .single();
          path = prof?.avatar_url;
        }
        if (path) {
          const url = await getAvatarUrl(path);
          setSignedAvatar(url);
        } else {
          setSignedAvatar(null);
        }
      } catch {
        setSignedAvatar(null);
      } finally {
        // refrescar cada 50 minutos aprox para evitar expirar (firma 60m)
        timer = setTimeout(() => {
          try {
            // fuerza re-ejecución
            setSignedAvatar(sa => sa); 
          } catch {}
        }, 50 * 60 * 1000);
      }
    })();
    return () => { if (timer) clearTimeout(timer); };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-vita-blue text-vita-white">
      <header className="sticky top-0 z-40 glass-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-vita-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : <div className="w-10"></div> }
            {title && <h1 className="text-xl font-bold text-vita-white">{title}</h1>}
          </div>
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-vita-white hover:bg-white/10"
                >
                  <Bell className="h-5 w-5" />
                  {hasNotifications && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-80 mr-4 bg-white/10 backdrop-blur-md border border-white/15 text-white" 
                align="end"
              >
                <DropdownMenuLabel className="font-semibold">Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/15" />
                {notifications.length === 0 ? (
                  <div className="p-3 text-sm text-white/80">Sin notificaciones recientes</div>
                ) : notifications.map((notification, index) => (
                  <DropdownMenuItem 
                    key={index} 
                    className="flex flex-col items-start gap-1 p-3 focus:bg-white/15"
                    onSelect={() => setHasNotifications(false)} // Example action
                  >
                    <div className="flex justify-between w-full">
                      <p className="font-semibold">{notification.title}</p>
                      <p className="text-xs text-white/70">{notification.time}</p>
                    </div>
                    <p className="text-sm text-white/80 w-full">{notification.description}</p>
                  </DropdownMenuItem>
                ))}
                 <DropdownMenuSeparator className="bg-white/15" />
                 <DropdownMenuItem className="justify-center p-2 focus:bg-white/15" onSelect={() => setHasNotifications(false)}>
                    <p className="text-sm font-semibold">Marcar todas como leídas</p>
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div 
              className="w-8 h-8 bg-vita-orange rounded-full flex items-center justify-center cursor-pointer overflow-hidden"
              onClick={() => navigate('/perfil')}
            >
              {signedAvatar ? (
                <img src={signedAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : user?.user_metadata?.avatarUrl ? (
                <img src={user.user_metadata.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm font-bold">
                  {(user?.user_metadata?.alias || user?.user_metadata?.name)?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 glass-card">
        <div className="flex justify-around py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            // Si es el botón de chat, abre modal en vez de navegar
            if (item.isChat) {
              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 rounded-lg transition-colors duration-300 text-vita-muted-foreground hover:text-vita-white hover:bg-white/5`}
                  onClick={() => setShowChat(true)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              );
            }
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 rounded-lg transition-colors duration-300 ${
                  isActive 
                    ? 'text-vita-orange bg-white/10' 
                    : 'text-vita-muted-foreground hover:text-vita-white hover:bg-white/5'
                }`}
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Botón flotante de regreso para páginas que no lo muestran en el header */}
      {showFloatingBack && (
        <button
          className="fixed top-3 left-3 z-50 rounded-full bg-white/10 border border-white/15 p-2 text-white hover:bg-white/20 active:scale-95 transition"
          onClick={() => navigate(-1)}
          aria-label="Regresar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

  {/* Modal/Sheet para el chat i-Vita */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/30 backdrop-blur-sm">
          <div className="relative w-full max-w-full h-full m-0 glass-card rounded-none shadow-xl border border-white/20 flex flex-col justify-center items-center">
            <button
              className="absolute top-2 right-2 text-vita-muted-foreground hover:text-vita-orange"
              onClick={() => { setShowChat(false); setChatError(""); }}
              aria-label="Cerrar chat"
            >
              ×
            </button>
            <div className="p-6 w-full max-w-2xl mx-auto">
              <div className="flex items-center mb-4 gap-2">
                <RobotIcon style={{ width: 32, height: 32 }} fill="#fff" />
                <span className="font-bold text-2xl text-vita-orange">i-Vita</span>
              </div>
              <div className="mb-4 text-vita-white/80 text-lg">
                ¿En qué puedo ayudarte?
              </div>
              {/* Sugerencias de ejemplo */}
              <div className="flex flex-wrap gap-2 mb-3">
                {examplePrompts.map((ex, i) => (
                  <button key={i} className="bg-white/10 text-xs text-white px-3 py-1 rounded-full hover:bg-white/20 transition" onClick={()=>setChatInput(ex)}>{ex}</button>
                ))}
              </div>
              {/* Chat UI funcional */}
              <div className="h-[60vh] bg-white/10 rounded-lg p-3 mb-3 overflow-y-auto border border-white/10 flex flex-col gap-2 text-base" id="ivita-chat-scroll">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`text-sm ${msg.from === "bot" ? "text-yellow-400 text-left" : "text-white text-right"}`}>
                    {msg.text}
                  </div>
                ))}
                {loadingChat && (
                  <div className="text-xs text-vita-orange animate-pulse">i-Vita está escribiendo…</div>
                )}
                {chatError && (
                  <div className="text-xs text-red-400 font-semibold">{chatError} <button className="underline ml-2" onClick={()=>{
                    setChatError(""); setChatInput(chatMessages[chatMessages.length-1]?.text || "");
                  }}>Reintentar</button></div>
                )}
              </div>
              <form className="flex gap-2" onSubmit={async e => {
                e.preventDefault();
                if (!chatInput.trim()) return;
                const userMsg = chatInput;
                setChatMessages(msgs => [...msgs, { from: "user", text: userMsg }]);
                setChatInput("");
                setLoadingChat(true);
                setChatError("");
                try {
                  const r = await askIVita(userMsg);
                  if (!r.ok) {
                    setChatError(`Error de conexión${r.status ? ` (status ${r.status})` : ""}. ${r.errorDetail || ""}`.trim());
                  } else {
                    setChatMessages(msgs => [...msgs, { from: "bot", text: r.text || "No tengo una respuesta en este momento." }]);
                  }
                } catch (err) {
                  setChatError("Error de conexión");
                }
                setLoadingChat(false);
                setTimeout(()=>{
                  const el = document.getElementById('ivita-chat-scroll');
                  if(el) el.scrollTop = el.scrollHeight;
                }, 100);
              }}>
                <input
                  type="text"
                  className="flex-1 rounded-lg px-3 py-2 bg-white/10 text-white placeholder:text-vita-muted-foreground focus:outline-none focus:ring-2 focus:ring-vita-orange"
                  placeholder="Escribe tu mensaje…"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  disabled={loadingChat}
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-full bg-vita-orange p-2 text-white hover:bg-vita-orange/80 transition disabled:opacity-50"
                  disabled={loadingChat || !chatInput.trim()}
                  title="Enviar"
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M2.5 10L17.5 3.5L11.25 10L17.5 16.5L2.5 10Z" fill="currentColor"/></svg>
                </button>
                <button
                  style={{ display: 'none' }}
                />
              </form>
              <div className="mt-2 text-xs text-vita-white/70 text-center px-2">
                Las recomendaciones de i-Vita se basan en inteligencia artificial y no sustituyen la consulta con un profesional de la salud. Ante dudas o síntomas graves, acude siempre con tu médico.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
