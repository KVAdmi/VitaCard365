
import React, { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const notifications = [
    { title: "Recordatorio de Cita", description: "Consulta con Dr. A. López mañana a las 10:00 AM.", time: "hace 5m" },
    { title: "Nuevo Tip de Bienestar", description: "Descubre los beneficios de la respiración cuadrada.", time: "hace 1h" },
    { title: "Pago Recibido", description: "Tu pago de membresía ha sido procesado exitosamente.", time: "hace 3h" },
];

const Layout = ({ children, title, showBackButton = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [hasNotifications, setHasNotifications] = useState(true);

  const navigationItems = [
    { path: '/dashboard', icon: Home, label: 'Inicio' },
    { path: '/agenda', icon: Calendar, label: 'Agenda' },
    { path: '/mi-plan', icon: CreditCard, label: 'Mi Plan' },
    { path: '/perfil', icon: User, label: 'Perfil' }
  ];

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
                {notifications.map((notification, index) => (
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
              {user?.user_metadata?.avatarUrl ? (
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
    </div>
  );
};

export default Layout;
