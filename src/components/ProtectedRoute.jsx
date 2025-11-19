import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { session, access, isReturningFromOAuth, ready } = useContext(AuthContext);
  const location = useLocation();
  const path = location.pathname;

  // Permitir callback siempre
  if (path.startsWith('/auth/callback')) return children;

  // Mientras AuthContext no esté listo, mostramos loader.
  if (!ready) {
    console.log('[ProtectedRoute] UI loading');
    return <div>Cargando…</div>;
  }

  // Si vienes del OAuth, no regreses a /login aunque session tarde un ms
  if (isReturningFromOAuth && path === '/login') {
    return <Navigate to="/mi-plan" replace />;
  }

  // Sin sesión -> solo /login
  if (!session) {
    console.log('[ProtectedRoute] No session, redirecting to login');
    return path === '/login' ? children : <Navigate to="/login" replace />;
  }

  // Con sesión, sin acceso -> forzar /mi-plan y bloquear navegación excepto pago
  if (session && access?.activo === false) {
    console.log('[ProtectedRoute] Session active but access inactive');
    const allowed = ['/mi-plan', '/payment', '/payment-gateway'];
    return allowed.some(p => path.startsWith(p))
      ? children
      : <Navigate to="/mi-plan" replace />;
  }

  // Con sesión y acceso activo -> pasa
  console.log('[ProtectedRoute] Session and access active, allowing route');
  return children;
}