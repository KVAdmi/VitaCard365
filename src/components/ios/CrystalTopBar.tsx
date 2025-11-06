import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

type NotificationItem = { title: string; description?: string; time?: string };

type CrystalTopBarProps = {
  showBackButton?: boolean;
  avatarSrc?: string | null;
  hasNotifications?: boolean;
  notifications?: NotificationItem[];
  onMarkAllRead?: () => void;
};

// Barra iOS-only: translúcida, segura en notch, sin blur real (solo color rgba + borde/sombra)
export const CrystalTopBar: React.FC<CrystalTopBarProps> = ({ showBackButton = false, avatarSrc, hasNotifications, notifications = [], onMarkAllRead }) => {
  const navigate = useNavigate();
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div
      className="fixed z-[4000] pointer-events-auto header-ios-safe border border-white/15 text-white"
      style={{
        top: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 48px)',
        left: 0,
        right: 0,
        margin: '0 auto',
        width: 'calc(100vw - 24px)',
        maxWidth: '640px',
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
      <div className="flex items-center gap-2">
        {showBackButton ? (
          <Button
            variant="ghost"
            size="icon"
            data-topbar="back"
            onClick={() => navigate(-1)}
            {...(isIOS ? {
              onPointerUp: (e: any) => { try { e.currentTarget.click(); } catch {} }
            } : {})}
            className="text-white hover:bg-white/10"
            aria-label="Regresar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <div style={{ width: 40, height: 40 }} />
        )}
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-topbar="bell"
              className="relative text-white hover:bg-white/10"
              aria-label="Notificaciones"
              onClick={undefined}
              {...(isIOS ? {
                onPointerUp: (e: any) => { try { e.currentTarget.click(); } catch {} }
              } : {})}
              style={{ touchAction: 'manipulation' }}
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
          <DropdownMenuPortal>
            <DropdownMenuContent className="w-80 mr-2 bg-white/10 backdrop-blur-md border border-white/15 text-white z-[5000] rounded-xl overflow-hidden" align="end" style={{zIndex:5000}}>
              <DropdownMenuLabel className="font-semibold">Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/15" />
              {notifications.length === 0 ? (
                <div className="p-3 text-sm text-white/80">Sin notificaciones recientes</div>
              ) : notifications.map((n, i) => (
                <DropdownMenuItem key={i} className="flex flex-col items-start gap-1 p-3 focus:bg-white/15">
                  <div className="flex justify-between w-full">
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-xs text-white/70">{n.time}</p>
                  </div>
                  {n.description && <p className="text-sm text-white/80 w-full">{n.description}</p>}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-white/15" />
              <DropdownMenuItem className="justify-center p-2 focus:bg-white/15" onSelect={() => onMarkAllRead && onMarkAllRead()}>
                <p className="text-sm font-semibold">Marcar todas como leídas</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
        <div
          className="w-8 h-8 rounded-full cursor-pointer"
          data-topbar="avatar"
          onClick={() => navigate('/perfil')}
          {...(isIOS ? {
            onPointerUp: (e: any) => { try { e.currentTarget.click(); } catch {} }
          } : {})}
          aria-label="Perfil"
          style={{ touchAction: 'manipulation' }}
        >
          <UserAvatar
            src={avatarSrc || undefined}
            name={'U'}
            className="w-8 h-8 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default CrystalTopBar;
