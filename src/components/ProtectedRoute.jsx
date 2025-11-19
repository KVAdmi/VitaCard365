import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { DEBUG_ACCESS } from '@/config/debug';

export default function ProtectedRoute({ children }) {
  const { session, access, ready } = useContext(AuthContext);
  const location = useLocation();
  const path = location.pathname;

  // Spinner mientras se restaura
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vita-orange"></div>
      </div>
    );
  }

  // Sin sesión → permitir solo /login
  if (!session) {
    return path === '/login' ? children : <Navigate to="/login" replace />;
  }

  // Con sesión y acceso inactivo → restringir excepto rutas de pago
  if (access && access.activo === false) {
    const allowed = ['/mi-plan', '/payment', '/payment-gateway', '/recibo'];
    const onAllowed = allowed.some(p => path.startsWith(p));
    if (!onAllowed) {
      if (DEBUG_ACCESS) console.log('[ProtectedRoute] acceso inactivo → /mi-plan');
      return <Navigate to="/mi-plan" replace />;
    }
  }

  return children;
}