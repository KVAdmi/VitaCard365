 import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useEntitlements } from '@/hooks/useEntitlements';

type Props = { children: React.ReactNode };

export default function CheckoutGate({ children }: Props) {
  const { session } = useAuth();
  const { profile, loading } = useProfile();
  // 🔧 FIX: pasar los dos argumentos (session, profile)
  const { paywallEnabled } = useEntitlements(session, profile);

  // Evita parpadeo mientras no hay perfil ni flag kv_gate
  if (loading && !sessionStorage.getItem('kv_gate')) return null;

  const kvGate = sessionStorage.getItem('kv_gate') === '1';

  // Si el paywall NO está habilitado (KV activo), redirige fuera del checkout
  if (kvGate && !paywallEnabled) return <Navigate to="/mi-plan" replace />;

  return <>{children}</>;
}
