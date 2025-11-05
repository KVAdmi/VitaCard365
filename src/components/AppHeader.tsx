import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { UserAvatar } from './ui/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  hasNotifications?: boolean;
  notifications?: Array<{
    title: string;
    description: string;
    time: string;
  }>;
  setHasNotifications?: (value: boolean) => void;
}

export function AppHeader({ 
  title, 
  showBackButton = false, 
  hasNotifications = false, 
  notifications = [], 
  setHasNotifications 
}: AppHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header
      className="fixed top-0 left-0 right-0 app-header-safe z-[1000] flex items-center px-4
                 bg-[rgba(10,20,40,0.92)] text-white header-ios-safe"
    >
        <div className="flex items-center justify-between w-full h-full">
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
            ) : <div className="w-10"></div>}
            {title && <h1 className="text-xl font-bold text-vita-white">{title}</h1>}
          </div>
          <div className="flex items-center space-x-2">
            {!showBackButton && (
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
                  ) : notifications.map((notification: any, index: number) => (
                    <DropdownMenuItem 
                      key={index} 
                      className="flex flex-col items-start gap-1 p-3 focus:bg-white/15"
                      onSelect={() => setHasNotifications?.(false)}
                    >
                      <div className="flex justify-between w-full">
                        <p className="font-semibold">{notification.title}</p>
                        <p className="text-xs text-white/70">{notification.time}</p>
                      </div>
                      <p className="text-sm text-white/80 w-full">{notification.description}</p>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-white/15" />
                  <DropdownMenuItem className="justify-center p-2 focus:bg-white/15" onSelect={() => setHasNotifications?.(false)}>
                    <p className="text-sm font-semibold">Marcar todas como leídas</p>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <div
              className="w-8 h-8 rounded-full cursor-pointer"
              onClick={() => navigate('/perfil')}
            >
              <UserAvatar
                src={user?.user_metadata?.avatarUrl}
                name={user?.user_metadata?.alias || user?.user_metadata?.name || 'U'}
                className="w-8 h-8 rounded-full"
              />
            </div>
          </div>
        </div>
    </header>
  );
}