

import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';


export default function ProtectedRoute({ children }) {
  const { session, access, isReturningFromOAuth, ready } = useContext(AuthContext);
  const location = useLocation();
  const path = location.pathname;
  const oauthFlag = typeof window !== 'undefined' ? localStorage.getItem('oauth_ok') : null;

  // Permitir callback siempre
  if (path.startsWith('/auth/callback')) return children;

  // Espera a que el auth esté listo (evita rebotes)
  if (!ready || (oauthFlag === '1' && (!session || access == null))) {
    return <div>Cargando…</div>;
  }

  // Si vienes del OAuth, no regreses a /login aunque session tarde un ms
  if (isReturningFromOAuth && path === '/login') return <Navigate to="/mi-plan" replace />;

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