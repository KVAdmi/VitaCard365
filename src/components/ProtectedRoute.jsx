

import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';


export default function ProtectedRoute({ children }) {
  const { session, access, ready } = useContext(AuthContext);
  const location = useLocation();
  const path = location.pathname;


  // Espera a que el auth esté listo (evita rebotes)
  if (!ready) {
    return <div>Cargando…</div>;
  }

  // Sin sesión -> solo /login
  if (!session) {
    return path === '/login' ? children : <Navigate to="/login" replace />;
  }

  // Con sesión, sin acceso -> forzar /mi-plan y bloquear navegación excepto pago
  if (access && access.activo === false) {
    const allowed = ['/mi-plan', '/payment', '/payment-gateway'];
    return allowed.some(p => path.startsWith(p)) ? children : <Navigate to="/mi-plan" replace />;
  }

  // Con sesión y acceso activo -> pasa
  return children;
}