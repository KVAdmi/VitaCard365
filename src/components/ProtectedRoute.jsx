import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessActive, setAccessActive] = useState(true);

  // Rutas permitidas cuando el acceso no está activo (páginas de pago)
  const allowedWhenInactive = ['/mi-plan', '/payment-gateway', '/paymentgateway', '/recibo'];
  const isOnAllowedPaymentRoute = allowedWhenInactive.some((p) => location.pathname.startsWith(p));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vita-orange"></div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir a login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Verificar estado de acceso del usuario en Supabase
  useEffect(() => {
    let isMounted = true;
    const checkAccess = async () => {
      try {
        setCheckingAccess(true);
        const { data, error } = await supabase
          .from('profiles_certificado_v2')
          .select('acceso_activo')
          .eq('user_id', user.id)
          .single();

        if (error) {
          // Si hay error, asumimos inactivo para forzar el flujo de pago
          if (isMounted) setAccessActive(false);
        } else {
          if (isMounted) setAccessActive(!!data?.acceso_activo);
        }
      } catch (err) {
        if (isMounted) setAccessActive(false);
      } finally {
        if (isMounted) setCheckingAccess(false);
      }
    };

    checkAccess();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vita-orange"></div>
      </div>
    );
  }

  // Si el acceso no está activo y no está en una ruta permitida de pago, redirigimos a /mi-plan
  if (!accessActive && !isOnAllowedPaymentRoute) {
    // En acceso inactivo, fuerza flujo de pago
    return <Navigate to="/payment-gateway" replace state={{ from: location.pathname }} />;
  }

  // Acceso permitido
  return children;
};

export default ProtectedRoute;