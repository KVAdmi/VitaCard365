
import React, { useEffect, useMemo, useState } from 'react';
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
import CrystalTopBar from '@/components/ios/CrystalTopBar';

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
import { getAvatarUrlCached } from '@/lib/avatar';
import { UserAvatar } from './ui/UserAvatar';
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
  // Flags iOS (Vite expone solo prefijo VITE_)
  const IOS_TOPBAR_ENABLED = useMemo(() => {
    try {
      const val = (import.meta)?.env?.VITE_IOS_CRYSTAL_TOPBAR;
      if (val === undefined || val === null) return true; // por defecto habilitado
      if (typeof val === 'string') return val === 'true' || val === '1';
      return !!val;
    } catch { return true; }
  }, []);
  const CROSS_TOPBAR_ENABLED = useMemo(() => {
    try {
      const val = (import.meta)?.env?.VITE_CRYSTAL_TOPBAR;
      if (val === undefined || val === null) return true; // por defecto ENCENDIDO en Android
      if (typeof val === 'string') return val === 'true' || val === '1';
      return !!val;
    } catch { return true; }
  }, []);
  const isIOS = useMemo(() => /iPhone|iPad|iPod/i.test(navigator.userAgent), []);
  const isAndroid = useMemo(() => /Android/i.test(navigator.userAgent), []);
  // Activa CrystalTopBar en iOS y Android; Web mantiene header clásico
  const crystalActive = false; // Apagar barra cristal para que use el header clásico
  // Altura visual aproximada de la barra para padding del contenido
  // Compensar la altura de la CrystalTopBar (56px) + margen extra (24px) cuando está activa
  const contentTopPad = crystalActive 
    // 48px (offset extra) + 56px (altura barra) + 8px aire
    ? 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 112px)'
    : 'calc(env(safe-area-inset-top, 0px) + 48px)';
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
    { path: '/i-vita', icon: RobotIcon, label: 'i-Vita', isChat: true },
    // Puerta naranja Vita (sin sombra)
    { path: '/salida', icon: (props) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" {...props}>
        <rect x="6" y="4" width="16" height="20" rx="4" fill="#f06340" />
        <rect x="10" y="10" width="8" height="8" rx="2" fill="#fff" />
        <rect x="18" y="12" width="2" height="8" rx="1" fill="#fff" />
        <circle cx="14" cy="14" r="1.5" fill="#f06340"/>
        <path d="M8 14h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ), label: 'Salir', isExit: true }
  ];

  // Fallback: mostrar botón flotante de regreso si no se pidió explícitamente
  const topLevel = ['/dashboard','/fit','/home','/','/agenda','/bienestar','/mi-plan','/perfil'];
  const showFloatingBack = !showBackButton && !topLevel.includes(location.pathname);
  const shouldShowBackTopBar = true; // iOS: mantener flecha siempre visible

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
  const [metaAvatarValid, setMetaAvatarValid] = useState(true);
  useEffect(() => {
    let timer;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const uid = u?.user?.id;
        if (!uid) { return; }
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
        // Mantener último avatar mientras se obtiene uno nuevo para evitar flicker
        if (path) {
          const url = await getAvatarUrlCached(path);
          if (url) setSignedAvatar(url);
        }
      } catch {
        // no limpiar imagen para evitar parpadeo
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
    <div className="min-h-[100dvh] bg-vita-blue text-vita-white">
      {!crystalActive && (
        <header
          className="flex items-center justify-center"
          style={{marginTop: 'calc(env(safe-area-inset-top, 24px) + 16px)'}}
        >
          <div className="card w-full max-w-[820px] mx-auto px-4">
            <div className="glass-card flex items-center justify-between w-full px-4 py-3 border border-white/15 text-white rounded-xl shadow-lg backdrop-blur-md" style={{minHeight: '64px'}}>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative text-white hover:bg-white/10"
                    >
                      <Bell className="h-6 w-6" />
                      {hasNotifications && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-80 mr-4 bg-white/10 backdrop-blur-md border border-white/15 text-white z-[5000] rounded-xl overflow-hidden" 
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
                        onSelect={() => setHasNotifications(false)}
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
                  className="w-9 h-9 rounded-full cursor-pointer"
                  onClick={() => navigate('/perfil')}
                >
                  <UserAvatar
                    src={signedAvatar || (metaAvatarValid && user?.user_metadata?.avatarUrl && /^https?:\/\//i.test(user.user_metadata.avatarUrl) ? user.user_metadata.avatarUrl : undefined)}
                    name={user?.user_metadata?.alias || user?.user_metadata?.name || 'U'}
                    className="w-9 h-9 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>
      )}
      {crystalActive && (
        <div
          className="fixed z-[4000] pointer-events-auto header-ios-safe border border-white/15 text-white w-full max-w-[820px] left-1/2 -translate-x-1/2"
          style={{
            top: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 48px)',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.05)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}
          aria-label="Barra superior iOS"
        >
          {children}
        </div>
      )}
      <main style={{ paddingBottom: '80px' }}>
        {children}
      </main>

  <nav className="fixed bottom-0 left-0 right-0 z-40 glass-card footer-menu app-tabbar-safe">
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
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              );
            }
              if (item.isExit) {
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 rounded-lg transition-colors duration-300 text-white hover:bg-white/10`}
                    onClick={async () => {
                      try {
                        if (Capacitor.isNativePlatform()) {
                          const { App } = await import('@capacitor/app');
                          if (App.exitApp) {
                            await App.exitApp();
                          }
                        } else {
                          // En web: cerrar sesión y redirigir a login
                          if (typeof supabase !== 'undefined') {
                            await supabase.auth.signOut();
                          }
                          navigate('/login');
                        }
                      } catch (err) {
                        // fallback: redirigir a login
                        navigate('/login');
                      }
                    }}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs font-bold text-white">{item.label}</span>
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
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Botón flotante de regreso para páginas que no lo muestran en el header */}
      {showFloatingBack && !crystalActive && (
        <button
          className="fixed left-3 z-50 rounded-full bg-white/10 border border-white/15 p-2 text-white hover:bg-white/20 active:scale-95 transition"
          style={{ top: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
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
            <div className="p-6 w-full max-w-2xl mx-auto">
              <div className="flex items-center mb-4 gap-2">
                <RobotIcon style={{ width: 32, height: 32 }} fill="#fff" />
                <span className="font-bold text-2xl text-vita-orange">i-Vita</span>
              </div>
              {/* Fila con texto y puerta de cierre alineada a la derecha */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-vita-white/80 text-lg">¿En qué puedo ayudarte?</div>
                <button
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow hover:bg-white/20 transition focus:outline-none ml-2"
                  onClick={() => { setShowChat(false); setChatError(""); }}
                  aria-label="Cerrar chat"
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect x="6" y="4" width="16" height="20" rx="4" fill="#f06340" />
                    <rect x="10" y="10" width="8" height="8" rx="2" fill="#fff" />
                    <rect x="18" y="12" width="2" height="8" rx="1" fill="#fff" />
                    <circle cx="14" cy="14" r="1.5" fill="#f06340"/>
                    <path d="M8 14h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
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
